<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GnEconomy extends Model
{
    protected $table = 'gn_economies';

    protected $fillable = [
        'name',
        'gn_number',
        'total',
        'employed',
        'unemployed',
        'economically_not_active',
    ];
}
