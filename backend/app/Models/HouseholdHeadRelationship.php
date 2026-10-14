<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HouseholdHeadRelationship extends Model
{
    use HasFactory;

    protected $fillable = [
        'grama_niladhari_id',
        'gn_name',
        'total_population',
        'head',
        'wife_husband',
        'son_daughter',
        'son_daughter_in_law',
        'grandchild_great_grandchild',
        'parent_of_head_or_spouse',
        'other_relative',
        'domestic_employee',
        'boarder',
        'non_relative',
        'clergy',
        'not_stated',
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class);
    }
}
