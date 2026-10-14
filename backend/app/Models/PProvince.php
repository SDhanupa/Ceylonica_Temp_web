<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PProvince extends Model
{
    protected $table = 'p_province';
    protected $guarded = [];

    public function gramaNiladharis()
    {
        return $this->hasMany(GramaNiladhari::class, 'province_code', 'admin1Pcode');
    }

    public function pDistricts()
    {
        return $this->hasMany(PDistrict::class, 'admin1Pcode', 'admin1Pcode');
    }

    public function getPopulationBothAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_prov_pop_both_{$this->admin1Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.province_code', $this->admin1Pcode)
                      ->sum('p_gns.population_both');
        });
    }

    public function getPopulationMaleAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_prov_pop_male_{$this->admin1Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.province_code', $this->admin1Pcode)
                      ->sum('p_gns.population_male');
        });
    }

    public function getPopulationFemaleAttribute()
    {
        return \Illuminate\Support\Facades\Cache::remember("p_prov_pop_female_{$this->admin1Pcode}", 86400, function () {
            return PGn::join('grama_niladharis', 'p_gns.grama_niladhari_id', '=', 'grama_niladharis.id')
                      ->where('grama_niladharis.province_code', $this->admin1Pcode)
                      ->sum('p_gns.population_female');
        });
    }
}
