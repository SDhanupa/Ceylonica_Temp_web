<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'section',
        'question_text_en',
        'question_text_si',
        'question_text_ta',
        'explanation_en',
        'explanation_si',
        'explanation_ta',
        'input_type',
        'is_repeater',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_repeater' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
