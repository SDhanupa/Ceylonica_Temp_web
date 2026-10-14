<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function getFirstNameAttribute()
    {
        return explode(' ', $this->name)[0] ?? 'User';
    }

    public function getLastNameAttribute()
    {
        $parts = explode(' ', $this->name);
        return isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : '';
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'nic',
        'mobile_number',
        'address',
        'dob',
        'gender',
        'keycloak_sub',
    ];

    /**
     * Get the deterministic Keycloak proxy password for this user
     */
    public function getProxyPassword(): string
    {
        // Deterministic hash based on app key, user NIC, and mobile to ensure it's securely linked to them
        return hash_hmac('sha256', $this->nic . '|' . $this->mobile_number, config('app.key'));
    }

    /**
     * The attributes that should be hidden for serialization.

     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
