<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PGn extends Model
{
    protected $table = 'p_gns';
    protected $guarded = [];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'grama_niladhari_id');
    }
}
