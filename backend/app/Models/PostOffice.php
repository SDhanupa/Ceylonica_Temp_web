<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostOffice extends Model
{
    protected $fillable = [
        'country_code',
        'province',
        'province_code',
        'district',
        'disid',
        'ds_aga',
        'ds_code',
        'postal_code',
        'place_name_english',
        'sinhala',
        'tamil',
        'latitude',
        'longitude',
        'accuracy',
    ];

    public function gramaNiladharis()
    {
        return $this->hasMany(GramaNiladhari::class, 'dis_en', 'district');
    }
}

