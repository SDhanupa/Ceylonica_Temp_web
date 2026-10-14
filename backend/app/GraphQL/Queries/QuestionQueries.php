<?php

namespace App\GraphQL\Queries;

use App\Models\Question;
use App\Models\UserAnswer;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final class QuestionQueries
{
    /**
     * Get all active questions ordered by section and sort_order
     */
    public function questions(mixed $root, array $args)
    {
        return Question::where('is_active', true)
            ->orderBy('section')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Get answers for the currently authenticated user
     */
    public function myAnswers($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        $user = request()->get('current_user') ?? request()->get('current_admin');
        if (!$user) {
            throw new \Exception("Unauthenticated.");
        }
        return UserAnswer::where('user_id', $user->id)->get();
    }

    public function categoryAnswers($rootValue, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        $categoryId = $args['categoryId'];
        
        $query = UserAnswer::whereHas('question', function ($q) use ($categoryId) {
            $q->where('category_id', $categoryId);
        })->with(['user', 'question']);

        // Restrict to current user if not admin
        $admin = request()->get('current_admin');
        if (!$admin) {
            $user = request()->get('current_user');
            if (!$user) {
                throw new \Exception("Unauthenticated.");
            }
            $query->where('user_id', $user->id);
        }

        return $query->get();
    }
}
