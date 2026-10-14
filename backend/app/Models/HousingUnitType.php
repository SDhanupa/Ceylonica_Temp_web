<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HousingUnitType extends Model
{
    use HasFactory;

    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_units',
        'permanent',
        'semi_permanent',
        'improvised',
        'unclassified'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
