<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DrinkingWaterSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_households',
        'protected_well_within',
        'protected_well_outside',
        'unprotected_well',
        'tap_within_unit',
        'tap_within_premises_outside',
        'tap_outside_premises',
        'rural_water_projects',
        'tube_well',
        'bowser',
        'river_tank_stream',
        'other'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
