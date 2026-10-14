<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IndustrySurvey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ccode',
        'district',
        'ds_division',
        'gn_name',
        'latitude',
        'longitude',
        'status',
        'form_data',
        'reg_number',
    ];

    protected $casts = [
        'form_data' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];
}
