<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GramaNiladhari extends Model
{
    protected $fillable = [
        'province_code',
        'PCCODE',
        'district_code',
        'DCCODE',
        'divisional_secretariat_code',
        'DSCCODE',
        'code',
        'CCODE',
        'name_si',
        'name_en',
        'name_ta',
        'pro_en',
        'pro_si',
        'pro_ta',
        'dis_en',
        'dis_si',
        'dis_ta',
        'ds_en',
        'ds_si',
        'ds_ta'
    ];

    public function scopeSearch($query, $search)
    {
        if ($search) {
            return $query->where('name_en', 'like', "%{$search}%")
                         ->orWhere('name_si', 'like', "%{$search}%")
                         ->orWhere('name_ta', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%")
                         ->orWhere('CCODE', 'like', "%{$search}%");
        }
        return $query;
    }

    public function police()
    {
        return $this->hasOne(Police::class, 'gnd_id', 'code');
    }

    public function postOffice()
    {
        return $this->belongsTo(PostOffice::class, 'post_office_id');
    }

    public function pProvince()
    {
        return $this->belongsTo(PProvince::class, 'province_code', 'admin1Pcode');
    }

    public function pDistrict()
    {
        return $this->belongsTo(PDistrict::class, 'district_code', 'admin2Pcode');
    }

    public function pGn()
    {
        return $this->hasOne(PGn::class, 'grama_niladhari_id');
    }

    public function gnEconomy()
    {
        return $this->hasOne(GnEconomy::class, 'gn_number', 'id');
    }

    public function housingOwnershipStatus()
    {
        return $this->hasOne(HousingOwnershipStatus::class, 'gn_id', 'id');
    }

    public function housingWallType()
    {
        return $this->hasOne(HousingWallType::class, 'gn_id', 'id');
    }

    public function housingUnitType()
    {
        return $this->hasOne(HousingUnitType::class, 'gn_id', 'id');
    }

    public function toiletFacility()
    {
        return $this->hasOne(ToiletFacility::class, 'gn_id', 'id');
    }

    public function drinkingWaterSource()
    {
        return $this->hasOne(DrinkingWaterSource::class, 'gn_id', 'id');
    }

    public function solidWasteDisposal()
    {
        return $this->hasOne(SolidWasteDisposal::class, 'gn_id', 'id');
    }

    public function roomsInHousingUnit()
    {
        return $this->hasOne(RoomsInHousingUnit::class, 'grama_niladhari_id', 'id');
    }

    public function housingRoofType()
    {
        return $this->hasOne(HousingRoofType::class, 'grama_niladhari_id', 'id');
    }

    public function religiousAffiliation()
    {
        return $this->hasOne(ReligiousAffiliation::class, 'grama_niladhari_id', 'id');
    }

    public function householdHeadRelationship()
    {
        return $this->hasOne(HouseholdHeadRelationship::class, 'grama_niladhari_id', 'id');
    }
}
