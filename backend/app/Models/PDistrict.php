<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PDistrict extends Model
{
    protected $table = 'p_district';
    protected $guarded = [];

    public function gramaNiladharis()
    {
        return $this->hasMany(GramaNiladhari::class, 'district_code', 'admin2Pcode');
    }

    public function pProvince()
    {
        return $this->belongsTo(PProvince::class, 'admin1Pcode', 'admin1Pcode');
    }

    public function getPopulationBothAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_dist_pop_both_{$this->admin2Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.district_code', $this->admin2Pcode)
                      ->sum('p_gns.population_both');
        });
    }

    public function getPopulationMaleAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_dist_pop_male_{$this->admin2Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.district_code', $this->admin2Pcode)
                      ->sum('p_gns.population_male');
        });
    }

    public function getPopulationFemaleAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_dist_pop_female_{$this->admin2Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.district_code', $this->admin2Pcode)
                      ->sum('p_gns.population_female');
        });
    }
}
