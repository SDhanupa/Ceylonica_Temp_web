<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReligiousAffiliation extends Model
{
    use HasFactory;

    protected $fillable = [
        'grama_niladhari_id',
        'gn_name',
        'total_population',
        'buddhist',
        'hindu',
        'islam',
        'roman_catholic',
        'other_christian',
        'other',
    ];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class);
    }
}
