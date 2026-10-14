<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HousingRoofType extends Model
{
    protected $fillable = [
        'grama_niladhari_id',
        'gn_name',
        'total_housing_units',
        'tile',
        'asbestos',
        'concrete',
        'zink_aluminium_sheet',
        'metal_sheet',
        'cadjan_palmyrah_straw',
        'other'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class);
    }
}
