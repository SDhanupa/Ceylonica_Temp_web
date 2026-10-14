<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HousingWallType extends Model
{
    use HasFactory;

    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_units',
        'brick',
        'cement_block_stone',
        'cabook',
        'soil_bricks',
        'mud',
        'cadjan_palmyrah',
        'plank_metal_sheet',
        'other'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
