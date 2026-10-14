<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ToiletFacility extends Model
{
    use HasFactory;

    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_households',
        'water_seal_piped_sewer',
        'water_seal_septic_tank',
        'pour_flush',
        'direct_pit',
        'other',
        'not_using'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
