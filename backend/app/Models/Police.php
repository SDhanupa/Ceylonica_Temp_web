<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Police extends Model
{
    protected $table = 'police';
    protected $guarded = [];

    public function gramaNiladhari()
    {
        return $this->belongsTo(GramaNiladhari::class, 'gnd_id', 'code');
    }
}
