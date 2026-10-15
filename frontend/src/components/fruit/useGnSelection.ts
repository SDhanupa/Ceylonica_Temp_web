import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_GN_LABEL_BY_CCODE, GET_P_DISTRICTS, GET_P_DISTRICT_GN_OPTIONS } from '../../graphql/queries';
import { buildDsDivisions } from '../../utils/dsDivisions';

const norm = (v?: string) => v?.trim().toLocaleLowerCase() || '';

/** District → DS → GN selection for GnTopHeaderBar, kept in sync with the GN in the URL. */
export function useGnSelection(ccode?: string) {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGN, setSelectedGN] = useState('');

  const { data: districtsData } = useQuery(GET_P_DISTRICTS, { fetchPolicy: 'cache-first' });
  const { data: districtGns } = useQuery(GET_P_DISTRICT_GN_OPTIONS, {
    variables: { id: selectedDistrict },
    skip: !selectedDistrict,
    fetchPolicy: 'cache-first',
  });
  const { data: activeData, loading: activeGnLoading } = useQuery(GET_GN_LABEL_BY_CCODE, {
    variables: { CCODE: ccode },
    skip: !ccode,
    fetchPolicy: 'cache-first',
  });

  const districts = districtsData?.pDistricts || [];
  const gnRows: any[] = useMemo(() => districtGns?.pDistrict?.gramaNiladharis || [], [districtGns]);
  const activeGn = ccode ? activeData?.gnByCcode : null;

  const dsDivisions = useMemo(() => buildDsDivisions(gnRows), [gnRows]);
  const activeDs = dsDivisions.find(ds => ds.code === (activeGn?.divisionalSecretariatCode || activeGn?.dsEn));

  const gramaNiladharis = useMemo(
    () => (selectedCity ? gnRows.filter((gn) => gn.divisionalSecretariatCode === selectedCity || gn.dsEn === selectedCity) : gnRows),
    [gnRows, selectedCity],
  );

  useEffect(() => {
    if (!activeGn) return;
    const districtName = norm(activeGn.pDistrict?.admin2NameEn || activeGn.disEn);
    const districtId =
      activeGn.pDistrict?.id ||
      districts.find((d: any) => norm(d.admin2NameEn) === districtName || norm(d.nameEn) === districtName)?.id;
    if (districtId) setSelectedDistrict(String(districtId));
    const dsCode = activeGn.divisionalSecretariatCode || activeGn.dsEn;
    if (dsCode) setSelectedCity(dsCode);
    if (activeGn.id) setSelectedGN(String(activeGn.id));
  }, [activeGn, districts]);

  const onDistrictChange = (id: string) => {
    setSelectedDistrict(id);
    setSelectedCity('');
    setSelectedGN('');
  };

  const onCityChange = (code: string) => {
    setSelectedCity(code);
    setSelectedGN('');
  };

  const onGNChange = (value: string) => {
    setSelectedGN(value);
    const chosen = gnRows.find((g) => String(g.id) === String(value) || g.CCODE === value);
    if (chosen?.CCODE && chosen?.nameEn) {
      navigate(`/gnpage/${encodeURIComponent(chosen.nameEn.trim().replace(/\s+/g, '-'))}/${encodeURIComponent(chosen.CCODE)}`);
    }
  };

  // Until the district's options arrive the header would render raw ids ("36", "LK1106").
  const optionsReady = gnRows.length > 0;

  return {
    activeGn: activeGn && activeDs ? { ...activeGn, dsSi: activeDs.dsSi, dsTa: activeDs.dsTa } : activeGn,
    activeGnLoading,
    headerProps: {
      districts,
      selectedDistrict,
      onDistrictChange,
      dsDivisions,
      selectedCity: optionsReady ? selectedCity : '',
      onCityChange,
      gramaNiladharis,
      selectedGN: optionsReady ? selectedGN : '',
      onGNChange,
    },
  };
}
