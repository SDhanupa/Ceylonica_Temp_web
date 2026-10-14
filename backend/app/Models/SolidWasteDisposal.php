<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolidWasteDisposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'gn_id',
        'gn_name',
        'ds_division',
        'district',
        'province',
        'total_households',
        'collected_by_local_authorities',
        'occupants_burn',
        'occupants_bury',
        'occupants_composting',
        'dispose_into_environment',
        'other'
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gn_id', 'id');
    }
}
