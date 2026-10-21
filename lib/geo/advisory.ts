import { AQICategory } from '@/types';

export interface HealthAdvisoryGroup {
  target: string;
  badge: string;
  recommendation: string;
  maskRecommendation: string;
  activityLevel: 'Normal' | 'Moderate Outdoor' | 'Reduce Strenuous' | 'Avoid Outdoor' | 'Stay Indoors';
}

export interface ComprehensiveHealthGuidance {
  category: AQICategory;
  aqiRange: string;
  headline: string;
  generalPublic: HealthAdvisoryGroup;
  sensitiveGroups: HealthAdvisoryGroup;
  outdoorWorkers: HealthAdvisoryGroup;
  schoolsAndChildren: HealthAdvisoryGroup;
  indoorAirMeasures: string[];
  medicalDisclaimer: string;
}

export function getHealthAdvisory(aqi: number): ComprehensiveHealthGuidance {
  const disclaimer =
    'PUBLIC HEALTH NOTICE: This advisory is environmental health risk guidance synthesized from WHO, US EPA, and regional public health benchmarks. It does not replace individualized clinical or medical diagnosis. Individuals with preexisting cardio-respiratory conditions should follow their physician’s action plan.';

  if (aqi <= 50) {
    return {
      category: 'Good',
      aqiRange: '0 - 50',
      headline: 'Air quality is satisfactory with minimal to no health risk.',
      generalPublic: {
        target: 'General Public',
        badge: 'Low Risk',
        recommendation: 'Air quality is ideal for all outdoor recreation, sports, and ventilation.',
        maskRecommendation: 'No mask required.',
        activityLevel: 'Normal',
      },
      sensitiveGroups: {
        target: 'Sensitive Individuals',
        badge: 'Normal',
        recommendation: 'No restrictions on standard daily outdoor activities.',
        maskRecommendation: 'No mask required.',
        activityLevel: 'Normal',
      },
      outdoorWorkers: {
        target: 'Outdoor Labor & Delivery',
        badge: 'Safe',
        recommendation: 'Standard occupational shifts without air quality hazard adjustments.',
        maskRecommendation: 'No mask required.',
        activityLevel: 'Normal',
      },
      schoolsAndChildren: {
        target: 'Schools & Nurseries',
        badge: 'Unrestricted',
        recommendation: 'Full outdoor sports and physical education classes permitted.',
        maskRecommendation: 'No mask required.',
        activityLevel: 'Normal',
      },
      indoorAirMeasures: [
        'Natural ventilation and window airing encouraged.',
        'HVAC fresh air intakes operating normally.',
      ],
      medicalDisclaimer: disclaimer,
    };
  }

  if (aqi <= 100) {
    return {
      category: 'Moderate',
      aqiRange: '51 - 100',
      headline: 'Air quality is acceptable; unusually sensitive individuals should observe symptoms.',
      generalPublic: {
        target: 'General Public',
        badge: 'Acceptable',
        recommendation: 'Safe to enjoy outdoor activities without special precautions.',
        maskRecommendation: 'Mask not required for the general public.',
        activityLevel: 'Normal',
      },
      sensitiveGroups: {
        target: 'Sensitive Individuals',
        badge: 'Cautionary',
        recommendation: 'People with asthma or chronic bronchitis should consider reducing prolonged or heavy outdoor exertion.',
        maskRecommendation: 'Keep an N95/KN95 respirator available if symptoms develop.',
        activityLevel: 'Moderate Outdoor',
      },
      outdoorWorkers: {
        target: 'Outdoor Labor & Delivery',
        badge: 'Standard',
        recommendation: 'Maintain regular hydration; report any localized smoke or dust irritations.',
        maskRecommendation: 'Optional comfort mask in heavy dust zones.',
        activityLevel: 'Normal',
      },
      schoolsAndChildren: {
        target: 'Schools & Nurseries',
        badge: 'Normal',
        recommendation: 'Standard outdoor recess allowed; monitor students with diagnosed respiratory allergies.',
        maskRecommendation: 'No mask required.',
        activityLevel: 'Normal',
      },
      indoorAirMeasures: [
        'Standard indoor ventilation suitable.',
        'Run standard air filters in urban dense areas.',
      ],
      medicalDisclaimer: disclaimer,
    };
  }

  if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      aqiRange: '101 - 150',
      headline: 'Members of sensitive groups may experience irritation; general public less likely affected.',
      generalPublic: {
        target: 'General Public',
        badge: 'Notice',
        recommendation: 'Most people can carry out routine outdoor tasks, but take regular rest breaks during strenuous exercise.',
        maskRecommendation: 'Mask optional for general population unless experiencing throat or eye irritation.',
        activityLevel: 'Moderate Outdoor',
      },
      sensitiveGroups: {
        target: 'Sensitive Individuals',
        badge: 'Elevated Risk',
        recommendation: 'Children, elderly, and adults with respiratory or heart disease should cut back prolonged or strenuous outdoor exertion.',
        maskRecommendation: 'Wear a well-fitted N95 / KF94 respirator when outdoors.',
        activityLevel: 'Reduce Strenuous',
      },
      outdoorWorkers: {
        target: 'Outdoor Labor & Delivery',
        badge: 'Advisory',
        recommendation: 'Employers should provide shaded rest areas and increase hydration frequency.',
        maskRecommendation: 'Recommended particulate masks (N95 or equivalent) for prolonged shifts.',
        activityLevel: 'Reduce Strenuous',
      },
      schoolsAndChildren: {
        target: 'Schools & Nurseries',
        badge: 'Restricted Exertion',
        recommendation: 'Reduce intensive outdoor aerobic training; keep vulnerable students indoors.',
        maskRecommendation: 'N95 masks advised for children with respiratory issues during commute.',
        activityLevel: 'Reduce Strenuous',
      },
      indoorAirMeasures: [
        'Close external windows during peak morning/evening smoke incursions.',
        'Operate indoor HEPA air purifiers in bedrooms and study areas.',
        'Avoid indoor burning, incense, or unvented cooking.',
      ],
      medicalDisclaimer: disclaimer,
    };
  }

  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      aqiRange: '151 - 200',
      headline: 'Everyone may begin to experience health effects; sensitive groups experience more serious effects.',
      generalPublic: {
        target: 'General Public',
        badge: 'Health Alert',
        recommendation: 'Avoid prolonged outdoor exertion; move strenuous workouts, jogging, and cycling indoors.',
        maskRecommendation: 'Wear an N95 / KN95 mask whenever traveling outdoors.',
        activityLevel: 'Avoid Outdoor',
      },
      sensitiveGroups: {
        target: 'Sensitive Individuals',
        badge: 'High Danger',
        recommendation: 'Remain indoors in air-conditioned or filtered environments; keep rescue medication accessible.',
        maskRecommendation: 'Strict N95 respirator usage mandatory if outdoor transit is unavoidable.',
        activityLevel: 'Stay Indoors',
      },
      outdoorWorkers: {
        target: 'Outdoor Labor & Delivery',
        badge: 'Hazardous Shift',
        recommendation: 'Mandatory rest rotations and reduced physical workload for outdoor construction and delivery personnel.',
        maskRecommendation: 'Mandatory certified N95 respirators with tight seal check.',
        activityLevel: 'Avoid Outdoor',
      },
      schoolsAndChildren: {
        target: 'Schools & Nurseries',
        badge: 'Cancel Outdoor Activity',
        recommendation: 'Cancel all outdoor sports events, assemblies, and physical education; keep doors and windows shut.',
        maskRecommendation: 'N95 masks for all students during drop-off and pickup.',
        activityLevel: 'Stay Indoors',
      },
      indoorAirMeasures: [
        'Keep all doors and windows tightly sealed.',
        'Run HEPA air purifiers continuously on medium/high speed.',
        'Set air conditioners to indoor recirculation mode (re-circulate, not fresh air pull).',
        'Wipe surfaces with damp microfiber cloths rather than dry dusting.',
      ],
      medicalDisclaimer: disclaimer,
    };
  }

  if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      aqiRange: '201 - 300',
      headline: 'Health alert: Risk of serious health effects is increased for the entire population.',
      generalPublic: {
        target: 'General Public',
        badge: 'Critical Warning',
        recommendation: 'Avoid all unnecessary outdoor physical activity; work from home where possible.',
        maskRecommendation: 'N95 / FFP2 mask mandatory for any necessary outdoor transit.',
        activityLevel: 'Stay Indoors',
      },
      sensitiveGroups: {
        target: 'Sensitive Individuals',
        badge: 'Severe Hazard',
        recommendation: 'Remain completely indoors within a clean air room; avoid all exposure to outside air.',
        maskRecommendation: 'N95 respirator required for any step outdoors.',
        activityLevel: 'Stay Indoors',
      },
      outdoorWorkers: {
        target: 'Outdoor Labor & Delivery',
        badge: 'Mandatory Work Halt',
        recommendation: 'Suspend non-emergency heavy outdoor manual labor or reassign indoors where feasible.',
        maskRecommendation: 'Industrial-grade N95 / P100 respirators mandatory.',
        activityLevel: 'Stay Indoors',
      },
      schoolsAndChildren: {
        target: 'Schools & Nurseries',
        badge: 'Closure Recommendation',
        recommendation: 'Recommend closure or shift to remote online learning per DOE/MOE national haze circular guidelines.',
        maskRecommendation: 'N95 respirators required for any required transit.',
        activityLevel: 'Stay Indoors',
      },
      indoorAirMeasures: [
        'Designate a "Clean Air Room" with sealed openings and active HEPA filtration.',
        'Seal drafts along door thresholds with draft stoppers or damp towels.',
        'Do not vacuum without a sealed HEPA exhaust filter.',
      ],
      medicalDisclaimer: disclaimer,
    };
  }

  // Hazardous (> 300)
  return {
    category: 'Hazardous',
    aqiRange: '301 - 500+',
    headline: 'Emergency Health Warning: The entire population is likely to be seriously affected.',
    generalPublic: {
      target: 'General Public',
      badge: 'Emergency Warning',
      recommendation: 'Remain strictly indoors with doors and windows sealed; postpone all non-essential travel.',
      maskRecommendation: 'N95 / P100 respirator strictly required outdoors.',
      activityLevel: 'Stay Indoors',
    },
    sensitiveGroups: {
      target: 'Sensitive Individuals',
      badge: 'Medical Emergency',
      recommendation: 'Evacuate to cleaner air shelter zones if indoor air quality cannot be sealed or purified.',
      maskRecommendation: 'Medical-grade N95 respirator mandatory at all times.',
      activityLevel: 'Stay Indoors',
    },
    outdoorWorkers: {
      target: 'Outdoor Labor & Delivery',
      badge: 'Emergency Stand-Down',
      recommendation: 'All non-emergency outdoor labor prohibited under occupational safety emergency orders.',
      maskRecommendation: 'P100 / N95 respirators required for emergency personnel.',
      activityLevel: 'Stay Indoors',
    },
    schoolsAndChildren: {
      target: 'Schools & Nurseries',
      badge: 'Mandatory Closure',
      recommendation: 'Full mandatory school and daycare closure across affected districts.',
      maskRecommendation: 'Respirators mandatory for children if transit is emergency-required.',
      activityLevel: 'Stay Indoors',
    },
    indoorAirMeasures: [
      'Complete home perimeter seal.',
      'Operate multiple HEPA purifiers continuously.',
      'Keep indoor physical exertion to minimum to reduce inhalation volume.',
      'Monitor district emergency broadcasts and civil defense haze advisories.',
    ],
    medicalDisclaimer: disclaimer,
  };
}
