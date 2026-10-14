<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HousingOwnershipStatus extends Model
{
    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_households',
        'owned_by_member',
        'rent_gov',
        'rent_private',
        'free_of_rent',
        'encroached',
        'other'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
