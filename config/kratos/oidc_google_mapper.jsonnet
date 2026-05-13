local claims = std.extVar('claims');

{
  identity: {
    traits: {
      email: claims.email,
      full_name: claims.name,
      [if std.objectHas(claims, 'picture') then 'avatar_url']: claims.picture,
    },
  },
}
