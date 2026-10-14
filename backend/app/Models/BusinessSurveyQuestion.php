<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessSurveyQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'step_index',
        'field_key',
        'type',
        'question_en',
        'question_si',
        'question_ta',
        'explanation_en',
        'explanation_si',
        'explanation_ta',
        'explanation_image',
        'options_json',
        'depends_on',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'options_json' => 'array',
        'is_active' => 'boolean',
    ];
}
