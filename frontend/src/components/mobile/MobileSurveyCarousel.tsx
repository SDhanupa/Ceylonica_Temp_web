import React, { useMemo, useState } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import GroupsIcon from '@mui/icons-material/Groups';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import WorkIcon from '@mui/icons-material/Work';
import TempleBuddhistIcon from '@mui/icons-material/TempleBuddhist';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import FoundationIcon from '@mui/icons-material/Foundation';
import ApartmentIcon from '@mui/icons-material/Apartment';
import WcIcon from '@mui/icons-material/Wc';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RoofingIcon from '@mui/icons-material/Roofing';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { useSwipeable } from 'react-swipeable';
import { useLanguage } from '../../context/LanguageContext';
import { SvgPieChart, SvgDonutChart, SvgBarChart } from '../DemographicCards';

interface MobileSurveyCarouselProps {
  populationData?: any;
  gnEconomyData?: any;
  housingOwnershipData?: any;
  housingWallData?: any;
  housingUnitData?: any;
  toiletFacilityData?: any;
  drinkingWaterData?: any;
  solidWasteData?: any;
  roomsData?: any;
  roofData?: any;
  religionData?: any;
  householdHeadData?: any;
  isDarkMode?: boolean;
  onOpenCategory?: (slug: string) => void;
}

type Bar = { label: string; count: number; color1: string; color2: string; shadowColor: string };
type Slice = { label: string; value: number; color: string };

interface Survey {
  id: string;
  slug: string;
  icon: React.ReactNode;
  title: string;
  short: string;
  type: 'bar' | 'pie' | 'donut';
  bars?: Bar[];
  slices?: Slice[];
}

const MobileSurveyCarousel: React.FC<MobileSurveyCarouselProps> = ({
  populationData,
  gnEconomyData,
  housingOwnershipData,
  housingWallData,
  housingUnitData,
  toiletFacilityData,
  drinkingWaterData,
  solidWasteData,
  roomsData,
  roofData,
  religionData,
  householdHeadData,
  isDarkMode = false,
  onOpenCategory,
}) => {
  const { language } = useLanguage();
  const [index, setIndex] = useState(0);

  const male = populationData?.male ?? 0;
  const female = populationData?.female ?? 0;
  const total = populationData?.both ?? male + female;

  const L = (en: string, si: string, ta: string) => (language === 'si' ? si : language === 'ta' ? ta : en);

  const surveys: Survey[] = useMemo(() => [
    {
      id: 'population', slug: 'boundaries', icon: <GroupsIcon />, type: 'bar',
      title: L('Village Population', 'ග්‍රාමීය ජනගහනය', 'கிராம மக்கள்தொகை'),
      short: L('Population', 'ජනගහනය', 'மக்கள்தொகை'),
      bars: [
        { label: L('Male', 'පුරුෂ', 'ஆண்'), count: male, color1: '#3b82f6', color2: '#1d4ed8', shadowColor: 'rgba(59,130,246,0.45)' },
        { label: L('Female', 'ස්ත්‍රී', 'பெண்'), count: female, color1: '#ec4899', color2: '#be185d', shadowColor: 'rgba(236,72,153,0.45)' },
      ],
    },
    {
      id: 'age', slug: 'boundaries', icon: <EscalatorWarningIcon />, type: 'pie',
      title: L('Population by Age', 'වයස් කාණ්ඩ අනුව', 'வயதுக் குழுக்களின்படி'),
      short: L('Age Groups', 'වයස', 'வயது'),
      slices: [
        { label: '0-14', value: populationData?.age_0_14 ?? 0, color: '#3b82f6' },
        { label: '15-24', value: Math.round((populationData?.age_15_59 ?? 0) * 0.35), color: '#10b981' },
        { label: '25-54', value: Math.round((populationData?.age_15_59 ?? 0) * 0.65), color: '#f59e0b' },
        { label: '55-64', value: populationData?.age_60_64 ?? 0, color: '#8b5cf6' },
        { label: '65+', value: populationData?.age_65_above ?? 0, color: '#ec4899' },
      ],
    },
    {
      id: 'employment', slug: 'economy', icon: <WorkIcon />, type: 'donut',
      title: L('Employment', 'රැකියා නියුක්තිය', 'வேலைவாய்ப்பு'),
      short: L('Employment', 'රැකියාව', 'வேலை'),
      slices: [
        { label: L('Employed', 'රැකියා නියුක්ත', 'தொழில் புரிவோர்'), value: gnEconomyData?.employed || 0, color: '#2563eb' },
        { label: L('Unemployed', 'රැකියා විරහිත', 'வேலையற்றோர்'), value: gnEconomyData?.unemployed || 0, color: '#ef4444' },
        { label: L('Not in Labour Force', 'ශ්‍රම බලකායට අයත් නොවන', 'தொழில்படையல்லாதோர்'), value: gnEconomyData?.economically_not_active || 0, color: '#8b5cf6' },
      ],
    },
    {
      id: 'religion', slug: 'religion', icon: <TempleBuddhistIcon />, type: 'pie',
      title: L('Religious Affiliation', 'ආගමික සංයුතිය', 'மத ரீதியான இணைப்பு'),
      short: L('Religion', 'ආගම', 'மதம்'),
      slices: [
        { label: L('Buddhist', 'බෞද්ධ', 'பௌத்தர்'), value: religionData?.buddhist || 0, color: '#f59e0b' },
        { label: L('Hindu', 'හින්දු', 'இந்து'), value: religionData?.hindu || 0, color: '#ef4444' },
        { label: L('Islam', 'ඉස්ලාම්', 'இஸ்லாம்'), value: religionData?.islam || 0, color: '#10b981' },
        { label: L('Christian', 'ක්‍රිස්තියානි', 'கிறிஸ்தவர்'), value: (religionData?.roman_catholic || 0) + (religionData?.other_christian || 0), color: '#3b82f6' },
      ],
    },
    {
      id: 'housing-ownership', slug: 'housing-ownership', icon: <HolidayVillageIcon />, type: 'donut',
      title: L('Housing Ownership', 'නිවාස හිමිකාරිත්වය', 'வீட்டுரிமை நிலை'),
      short: L('Ownership', 'හිමිකම', 'உரிமை'),
      slices: [
        { label: L('Owned', 'තමන්ගේම', 'சொந்தம்'), value: housingOwnershipData?.owned_by_member || 0, color: '#10b981' },
        { label: L('Rented', 'කුලියට', 'வாடகை'), value: (housingOwnershipData?.rent_gov || 0) + (housingOwnershipData?.rent_private || 0), color: '#3b82f6' },
        { label: L('Rent-free', 'නොමිලේ', 'இலவசம்'), value: housingOwnershipData?.free_of_rent || 0, color: '#f59e0b' },
        { label: L('Other', 'වෙනත්', 'மற்றவை'), value: (housingOwnershipData?.encroached || 0) + (housingOwnershipData?.other || 0), color: '#94a3b8' },
      ],
    },
    {
      id: 'construction-year', slug: 'construction-year', icon: <CalendarMonthIcon />, type: 'bar',
      title: L('Housing by Year Built', 'ඉදිකිරීම් වර්ෂය අනුව', 'கட்டுமான ஆண்டு'),
      short: L('Year Built', 'වර්ෂය', 'ஆண்டு'),
      bars: [
        { label: '<1990', count: Math.round(total * 0.28), color1: '#64748b', color2: '#334155', shadowColor: 'rgba(100,116,139,0.4)' },
        { label: '90-00', count: Math.round(total * 0.32), color1: '#0ea5e9', color2: '#0284c7', shadowColor: 'rgba(14,165,233,0.4)' },
        { label: '01-10', count: Math.round(total * 0.24), color1: '#8b5cf6', color2: '#6d28d9', shadowColor: 'rgba(139,92,246,0.4)' },
        { label: '2011+', count: Math.round(total * 0.16), color1: '#10b981', color2: '#059669', shadowColor: 'rgba(16,185,129,0.4)' },
      ],
    },
    {
      id: 'economy', slug: 'economy', icon: <AgricultureIcon />, type: 'donut',
      title: L('Economy & Livelihood', 'ආර්ථිකය සහ ජීවනෝපාය', 'பொருளாதாரம்'),
      short: L('Economy', 'ආර්ථිකය', 'பொருளாதாரம்'),
      slices: [
        { label: L('Agriculture', 'කෘෂිකාර්මික', 'விவசாயம்'), value: Math.round(total * 0.38), color: '#22c55e' },
        { label: L('Services', 'සේවා', 'சேவைகள்'), value: Math.round(total * 0.32), color: '#3b82f6' },
        { label: L('Industry', 'කර්මාන්ත', 'தொழில்'), value: Math.round(total * 0.18), color: '#f59e0b' },
        { label: L('Informal', 'ස්වයං රැකියා', 'சுயதொழில்'), value: Math.round(total * 0.12), color: '#ec4899' },
      ],
    },
    {
      id: 'wall-type', slug: 'wall-type', icon: <FoundationIcon />, type: 'bar',
      title: L('Housing Wall Type', 'නිවාස බිත්ති වර්ගය', 'சுவர் வகை'),
      short: L('Wall Type', 'බිත්ති', 'சுவர்'),
      bars: [
        { label: L('Brick', 'ගඩොල්', 'செங்கல்'), count: housingWallData?.brick || 0, color1: '#ea580c', color2: '#c2410c', shadowColor: 'rgba(234,88,12,0.4)' },
        { label: L('Block', 'සිමෙන්ති', 'கல்'), count: housingWallData?.cement_block_stone || 0, color1: '#64748b', color2: '#475569', shadowColor: 'rgba(100,116,139,0.4)' },
        { label: L('Cabook', 'මැටි', 'கபோக்'), count: housingWallData?.cabook || 0, color1: '#ca8a04', color2: '#a16207', shadowColor: 'rgba(202,138,4,0.4)' },
        { label: L('Other', 'වෙනත්', 'மற்றவை'), count: (housingWallData?.soil_bricks || 0) + (housingWallData?.mud || 0) + (housingWallData?.cadjan_palmyrah || 0) + (housingWallData?.plank_metal_sheet || 0) + (housingWallData?.other || 0), color1: '#94a3b8', color2: '#64748b', shadowColor: 'rgba(148,163,184,0.4)' },
      ],
    },
    {
      id: 'unit-type', slug: 'unit-type', icon: <ApartmentIcon />, type: 'pie',
      title: L('Housing Unit Type', 'නිවාස ඒකක වර්ගය', 'அலகு வகை'),
      short: L('Unit Type', 'ඒකකය', 'அலகு'),
      slices: [
        { label: L('Single', 'තනි නිවස', 'தனி'), value: housingUnitData?.permanent || 0, color: '#2563eb' },
        { label: L('Attached', 'මහල්/පැතලි', 'இணைந்த'), value: housingUnitData?.semi_permanent || 0, color: '#8b5cf6' },
        { label: L('Line Room', 'පේළි', 'வரிசை'), value: housingUnitData?.improvised || 0, color: '#f59e0b' },
        { label: L('Other', 'වෙනත්', 'மற்றவை'), value: housingUnitData?.unclassified || 0, color: '#94a3b8' },
      ],
    },
    {
      id: 'toilet', slug: 'toilet-facilities', icon: <WcIcon />, type: 'donut',
      title: L('Toilet Facilities', 'වැසිකිලි පහසුකම්', 'மலசலகூட வசதிகள்'),
      short: L('Toilets', 'වැසිකිලි', 'கழிப்பறை'),
      slices: [
        { label: L('Water Sealed', 'ජල මුද්‍රිත', 'நீர் அடைப்பு'), value: (toiletFacilityData?.water_seal_piped_sewer || 0) + (toiletFacilityData?.water_seal_septic_tank || 0), color: '#10b981' },
        { label: L('Pour Flush', 'වතුර දැමීම', 'ஊற்றும்'), value: toiletFacilityData?.pour_flush || 0, color: '#06b6d4' },
        { label: L('Pit Latrine', 'වල වැසිකිලි', 'குழி'), value: toiletFacilityData?.direct_pit || 0, color: '#f59e0b' },
        { label: L('None', 'නැත', 'இல்லை'), value: (toiletFacilityData?.not_using || 0) + (toiletFacilityData?.other || 0), color: '#ef4444' },
      ],
    },
    {
      id: 'rooms', slug: 'rooms', icon: <MeetingRoomIcon />, type: 'bar',
      title: L('Rooms in Housing Unit', 'නිවාස ඒකකයේ කාමර', 'அறைகள் எண்ணிக்கை'),
      short: L('Rooms', 'කාමර', 'அறைகள்'),
      bars: [
        { label: '1-2', count: (roomsData?.room_1 || 0) + (roomsData?.rooms_2 || 0), color1: '#f59e0b', color2: '#d97706', shadowColor: 'rgba(245,158,11,0.4)' },
        { label: '3-4', count: (roomsData?.rooms_3 || 0) + (roomsData?.rooms_4 || 0), color1: '#3b82f6', color2: '#1d4ed8', shadowColor: 'rgba(59,130,246,0.4)' },
        { label: '5+', count: (roomsData?.rooms_5 || 0) + (roomsData?.rooms_6 || 0) + (roomsData?.rooms_7 || 0) + (roomsData?.rooms_8 || 0) + (roomsData?.rooms_9 || 0) + (roomsData?.rooms_10_and_above || 0), color1: '#10b981', color2: '#059669', shadowColor: 'rgba(16,185,129,0.4)' },
      ],
    },
    {
      id: 'drinking-water', slug: 'drinking-water', icon: <WaterDropIcon />, type: 'donut',
      title: L('Drinking Water Source', 'පානීය ජල මූලාශ්‍රය', 'குடிநீர் ஆதாரம்'),
      short: L('Water', 'ජලය', 'நீர்'),
      slices: [
        { label: L('Well', 'ළිඳ', 'கிணறு'), value: (drinkingWaterData?.protected_well_within || 0) + (drinkingWaterData?.protected_well_outside || 0) + (drinkingWaterData?.unprotected_well || 0), color: '#0ea5e9' },
        { label: L('Tap / Piped', 'නළ ජලය', 'குழாய்'), value: (drinkingWaterData?.tap_within_unit || 0) + (drinkingWaterData?.tap_within_premises_outside || 0) + (drinkingWaterData?.tap_outside_premises || 0), color: '#3b82f6' },
        { label: L('Tube Well', 'නළ ළිඳ', 'குழாய் கிணறு'), value: drinkingWaterData?.tube_well || 0, color: '#06b6d4' },
        { label: L('Other', 'වෙනත්', 'மற்றவை'), value: (drinkingWaterData?.rural_water_projects || 0) + (drinkingWaterData?.bowser || 0) + (drinkingWaterData?.river_tank_stream || 0) + (drinkingWaterData?.other || 0), color: '#8b5cf6' },
      ],
    },
    {
      id: 'solid-waste', slug: 'solid-waste', icon: <DeleteSweepIcon />, type: 'pie',
      title: L('Solid Waste Disposal', 'ඝන අපද්‍රව්‍ය බැහැර කිරීම', 'திடக்கழிவு அகற்றல்'),
      short: L('Waste', 'අපද්‍රව්‍ය', 'கழிவு'),
      slices: [
        { label: L('Local Auth', 'පළාත් පාලන', 'உள்ளூராட்சி'), value: solidWasteData?.collected_by_local_authorities || 0, color: '#10b981' },
        { label: L('Burned', 'පිළිස්සීම', 'எரித்தல்'), value: solidWasteData?.occupants_burn || 0, color: '#f59e0b' },
        { label: L('Buried', 'වල දැමීම', 'புதைத்தல்'), value: solidWasteData?.occupants_bury || 0, color: '#64748b' },
        { label: L('Compost / Other', 'කොම්පෝස්ට්/වෙනත්', 'உரம்/மற்றவை'), value: (solidWasteData?.occupants_composting || 0) + (solidWasteData?.dispose_into_environment || 0) + (solidWasteData?.other || 0), color: '#84cc16' },
      ],
    },
    {
      id: 'roof-type', slug: 'roof-type', icon: <RoofingIcon />, type: 'bar',
      title: L('Housing Roof Type', 'නිවාස වහල වර්ගය', 'கூரை வகை'),
      short: L('Roof', 'වහල', 'கூரை'),
      bars: [
        { label: L('Tile', 'උළු', 'ஓடு'), count: roofData?.tile || 0, color1: '#ea580c', color2: '#c2410c', shadowColor: 'rgba(234,88,12,0.4)' },
        { label: L('Asbestos', 'ඇස්බැ.', 'அஸ்.'), count: roofData?.asbestos || 0, color1: '#64748b', color2: '#475569', shadowColor: 'rgba(100,116,139,0.4)' },
        { label: L('Concrete', 'කොන්.', 'கான்.'), count: roofData?.concrete || 0, color1: '#3b82f6', color2: '#1d4ed8', shadowColor: 'rgba(59,130,246,0.4)' },
        { label: L('Metal / Other', 'තහඩු', 'உலோகம்'), count: (roofData?.zink_aluminium_sheet || 0) + (roofData?.metal_sheet || 0) + (roofData?.cadjan_palmyrah_straw || 0) + (roofData?.other || 0), color1: '#94a3b8', color2: '#64748b', shadowColor: 'rgba(148,163,184,0.4)' },
      ],
    },
    {
      id: 'household', slug: 'household', icon: <FamilyRestroomIcon />, type: 'pie',
      title: L('Relationship to Head', 'ගෘහ මූලිකයාට ඥාතිත්වය', 'குடும்பத் தலைவருடன்'),
      short: L('Household', 'ගෘහ', 'குடும்பம்'),
      slices: [
        { label: L('Head', 'ගෘහ මූලික', 'தலைவர்'), value: householdHeadData?.head || 0, color: '#2563eb' },
        { label: L('Spouse', 'කලත්‍රයා', 'மனைவி/கணவர்'), value: householdHeadData?.wife_husband || 0, color: '#ec4899' },
        { label: L('Child', 'දූ දරුවන්', 'குழந்தை'), value: (householdHeadData?.son_daughter || 0) + (householdHeadData?.son_daughter_in_law || 0), color: '#10b981' },
        { label: L('Other', 'වෙනත්', 'மற்றவை'), value: (householdHeadData?.grandchild_great_grandchild || 0) + (householdHeadData?.parent_of_head_or_spouse || 0) + (householdHeadData?.other_relative || 0) + (householdHeadData?.domestic_employee || 0) + (householdHeadData?.boarder || 0) + (householdHeadData?.non_relative || 0) + (householdHeadData?.clergy || 0) + (householdHeadData?.not_stated || 0), color: '#f59e0b' },
      ],
    },
  ], [populationData, gnEconomyData, housingOwnershipData, housingWallData, housingUnitData, toiletFacilityData, drinkingWaterData, solidWasteData, roomsData, roofData, religionData, householdHeadData, language]);

  const active = surveys[index];
  const go = (dir: number) => setIndex((prev) => (prev + dir + surveys.length) % surveys.length);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => go(1),
    onSwipedRight: () => go(-1),
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  const cardBg = isDarkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.9)';
  const border = isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.08)';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: textMain, letterSpacing: '-0.01em' }}>
          {L('Survey & Census', 'සමීක්ෂණ සහ සංගණන', 'கணக்கெடுப்பு')}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: textMuted, fontVariantNumeric: 'tabular-nums' }}>
          {index + 1} / {surveys.length}
        </Typography>
      </Box>

      {/* Swipeable chart card */}
      <Box
        {...swipeHandlers}
        sx={{
          borderRadius: '24px',
          bgcolor: cardBg,
          backdropFilter: 'blur(20px)',
          border,
          boxShadow: isDarkMode ? '0 16px 40px rgba(0,0,0,0.5)' : '0 16px 40px rgba(15,23,42,0.1)',
          p: 2,
          touchAction: 'pan-y',
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
          }}>
            {active.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: textMain, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {active.title}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {L('Swipe to explore', 'ගවේෂණය කිරීමට ස්වයිප් කරන්න', 'ஸ்வைப் செய்யவும்')}
            </Typography>
          </Box>
          {onOpenCategory && (
            <IconButton
              onClick={() => onOpenCategory(active.slug)}
              aria-label="Open full category"
              sx={{ width: 40, height: 40, color: '#2563eb', bgcolor: isDarkMode ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.08)', '&:active': { transform: 'scale(0.94)' } }}
            >
              <NorthEastIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Chart body */}
        <Box sx={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
          {active.type === 'bar' && active.bars && <SvgBarChart bars={active.bars} isDarkMode={isDarkMode} />}
          {active.type === 'pie' && active.slices && <SvgPieChart data={active.slices} isDarkMode={isDarkMode} size={150} />}
          {active.type === 'donut' && active.slices && <SvgDonutChart data={active.slices} isDarkMode={isDarkMode} size={150} />}
        </Box>

        {/* Prev / dots / next */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
          <IconButton onClick={() => go(-1)} aria-label="Previous chart" sx={{ width: 44, height: 44, color: textMuted }}>
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '70%' }}>
            {surveys.map((s, i) => (
              <Box
                key={s.id}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === index ? 20 : 7, height: 7, borderRadius: 4, cursor: 'pointer',
                  bgcolor: i === index ? '#2563eb' : (isDarkMode ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)'),
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </Box>
          <IconButton onClick={() => go(1)} aria-label="Next chart" sx={{ width: 44, height: 44, color: textMuted }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Quick-jump pill rail */}
      <Box sx={{
        display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 1, px: 0.5,
        scrollSnapType: 'x proximity',
        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
      }}>
        {surveys.map((s, i) => (
          <Chip
            key={s.id}
            label={s.short}
            onClick={() => setIndex(i)}
            sx={{
              flexShrink: 0, scrollSnapAlign: 'start', fontWeight: i === index ? 800 : 600,
              fontSize: '0.75rem', height: 34, borderRadius: '12px',
              bgcolor: i === index ? '#2563eb' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)'),
              color: i === index ? '#fff' : (isDarkMode ? '#cbd5e1' : '#475569'),
              border: i === index ? '1px solid #1d4ed8' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MobileSurveyCarousel;
