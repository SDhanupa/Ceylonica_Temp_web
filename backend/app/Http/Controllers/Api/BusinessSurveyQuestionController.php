<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessSurveyQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BusinessSurveyQuestionController extends Controller
{
    /**
     * Highest step the survey wizard renders. Mirrors `TOTAL_STEPS - 1` in
     * frontend/src/components/survey/surveyValidation.ts — a row saved above this
     * is unreachable for respondents and invisible in the builder, so it is
     * rejected here rather than silently stored.
     */
    private const MAX_STEP_INDEX = 13;

    /**
     * Types DynamicQuestionRenderer can actually draw. Anything else renders as
     * an empty gap on the form. 'custom' is reserved for the hardcoded steps 0-1,
     * whose rows exist only to carry editable labels and explanations.
     */
    private const ALLOWED_TYPES = ['text', 'email', 'tel', 'number', 'textarea', 'select', 'multiselect', 'custom'];

    /** Types that require an options list to be answerable. */
    private const CHOICE_TYPES = ['select', 'multiselect'];

    /** Steps rendered from hardcoded JSX rather than from these rows. */
    private const HARDCODED_STEPS = [0, 1];

    /**
     * Public listing used by the survey form. Inactive rows are withheld so
     * deactivating a question removes it from the form.
     */
    public function index(): JsonResponse
    {
        $questions = BusinessSurveyQuestion::where('is_active', true)
            ->orderBy('step_index')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->withImageUrls($questions),
        ]);
    }

    /**
     * Admin listing. Includes inactive rows, which `index()` hides: without this
     * the builder could neither show nor re-enable a deactivated question.
     */
    public function adminIndex(): JsonResponse
    {
        $questions = BusinessSurveyQuestion::orderBy('step_index')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->withImageUrls($questions),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $question = BusinessSurveyQuestion::create($validated);

        return response()->json([
            'success' => true,
            'data' => $this->withImageUrl($question),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $question = BusinessSurveyQuestion::findOrFail($id);
        $validated = $this->validatePayload($request, $question);

        if ($request->boolean('remove_explanation_image') && $question->explanation_image) {
            Storage::disk('public')->delete($question->explanation_image);
            $validated['explanation_image'] = null;
        }

        $question->update($validated);

        return response()->json([
            'success' => true,
            'data' => $this->withImageUrl($question->fresh()),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $question = BusinessSurveyQuestion::findOrFail($id);

        if ($question->explanation_image) {
            Storage::disk('public')->delete($question->explanation_image);
        }

        $question->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Validates and normalises a write payload. Normalisation matters as much as
     * validation here: options left behind by a type change would otherwise stay
     * on the row and reappear if the type were switched back.
     */
    private function validatePayload(Request $request, ?BusinessSurveyQuestion $existing = null): array
    {
        $validated = $request->validate([
            'step_index' => ['required', 'integer', 'min:0', 'max:' . self::MAX_STEP_INDEX],
            'field_key' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z][a-z0-9_]*$/',
                Rule::unique('business_survey_questions', 'field_key')->ignore($existing?->id),
            ],
            'type' => ['required', Rule::in(self::ALLOWED_TYPES)],
            'question_en' => ['required', 'string', 'max:1000'],
            'question_si' => ['nullable', 'string', 'max:1000'],
            'question_ta' => ['nullable', 'string', 'max:1000'],
            'explanation_en' => ['nullable', 'string', 'max:2000'],
            'explanation_si' => ['nullable', 'string', 'max:2000'],
            'explanation_ta' => ['nullable', 'string', 'max:2000'],
            'options_json' => ['nullable'],
            'depends_on' => ['nullable', 'string', 'max:255', 'regex:/^[a-z][a-z0-9_]*:[^:]+$/'],
            'is_active' => ['nullable'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'explanation_image' => ['nullable', 'image', 'max:5120'],
            'remove_explanation_image' => ['nullable', 'boolean'],
        ], [
            'field_key.regex' => 'The field key must be lower snake_case (letters, digits and underscores, starting with a letter).',
            'depends_on.regex' => 'Conditional logic must look like parent_field_key:value or parent_field_key:value1,value2.',
            'step_index.max' => 'The survey only has steps 0-' . self::MAX_STEP_INDEX . '. A question above that would never be shown.',
        ]);

        unset($validated['remove_explanation_image']);

        $validated['options_json'] = $this->normaliseOptions($request, $validated['type']);

        if (in_array($validated['type'], self::CHOICE_TYPES, true) && empty($validated['options_json']['en'])) {
            abort(response()->json([
                'success' => false,
                'message' => 'A dropdown or multi-select question needs at least one option.',
                'errors' => ['options_json' => ['At least one option with English text is required.']],
            ], 422));
        }

        if (in_array($validated['type'], self::CHOICE_TYPES, true) === false) {
            $validated['options_json'] = null;
        }

        if (in_array($validated['step_index'], self::HARDCODED_STEPS, true) === false && $validated['type'] === 'custom') {
            abort(response()->json([
                'success' => false,
                'message' => "Type 'custom' only renders on the hardcoded steps 0 and 1. Pick a real input type for this step.",
                'errors' => ['type' => ["'custom' is not renderable on step {$validated['step_index']}."]],
            ], 422));
        }

        if (!empty($validated['depends_on'])) {
            $this->assertDependencyResolvable($validated['depends_on'], $validated['field_key']);
        }

        if ($request->hasFile('explanation_image')) {
            if ($existing?->explanation_image) {
                Storage::disk('public')->delete($existing->explanation_image);
            }
            $validated['explanation_image'] = $request->file('explanation_image')->store('question_images', 'public');
        }

        if (array_key_exists('is_active', $validated)) {
            $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        return $validated;
    }

    /**
     * Accepts the {en:[],si:[],ta:[]} shape the builder sends (as a JSON string in
     * multipart requests) and drops blank trailing rows the editor may leave.
     */
    private function normaliseOptions(Request $request, string $type): ?array
    {
        if (!in_array($type, self::CHOICE_TYPES, true)) {
            return null;
        }

        $raw = $request->input('options_json');

        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }

        if (!is_array($raw)) {
            return null;
        }

        $clean = [];
        foreach (['en', 'si', 'ta'] as $lang) {
            $values = array_values(array_filter(
                array_map(static fn ($v) => is_string($v) ? trim($v) : $v, $raw[$lang] ?? []),
                static fn ($v) => $v !== null && $v !== ''
            ));

            if ($values !== []) {
                $clean[$lang] = $values;
            }
        }

        return $clean === [] ? null : $clean;
    }

    /**
     * A question whose parent key does not exist can never become visible, which
     * is silent on the form — so refuse it at write time.
     */
    private function assertDependencyResolvable(string $dependsOn, string $ownKey): void
    {
        [$parentKey] = explode(':', $dependsOn, 2);

        if ($parentKey === $ownKey) {
            abort(response()->json([
                'success' => false,
                'message' => 'A question cannot depend on itself.',
                'errors' => ['depends_on' => ['A question cannot depend on itself.']],
            ], 422));
        }

        if (!BusinessSurveyQuestion::where('field_key', $parentKey)->exists()) {
            abort(response()->json([
                'success' => false,
                'message' => "No question has the field key '{$parentKey}', so this condition could never be met.",
                'errors' => ['depends_on' => ["Unknown parent field key '{$parentKey}'."]],
            ], 422));
        }
    }

    private function withImageUrls($questions)
    {
        return $questions->map(fn ($q) => $this->withImageUrl($q));
    }

    private function withImageUrl(BusinessSurveyQuestion $question): BusinessSurveyQuestion
    {
        if ($question->explanation_image) {
            $question->explanation_image_url = asset('storage/' . $question->explanation_image);
        }

        return $question;
    }
}
