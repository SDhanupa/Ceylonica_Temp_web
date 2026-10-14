<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomsInHousingUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'grama_niladhari_id',
        'gn_name',
        'total_housing_units',
        'room_1',
        'rooms_2',
        'rooms_3',
        'rooms_4',
        'rooms_5',
        'rooms_6',
        'rooms_7',
        'rooms_8',
        'rooms_9',
        'rooms_10_and_above',
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class);
    }
}
