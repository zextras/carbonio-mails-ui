import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';

/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const timeZoneList = (): Array<{ value?: string; label: string; offSet?: string }> => [
	{
		value: 'Etc/GMT+12',
		label: getBridgedFunctions()?.t('timezone.etc_gmt+12', {
			value: 'GMT -12:00',
			defaultValue: '{{value}} Dateline'
		})
	},
	{
		value: 'Pacific/Midway',
		label: getBridgedFunctions()?.t('timezone.pacific_midway', {
			value: 'GMT -11:00',
			defaultValue: '{{value}} Samoa'
		})
	},
	{
		value: 'America/Adak',
		label: getBridgedFunctions()?.t('timezone.america_adak', {
			value: 'GMT -10:00',
			defaultValue: '{{value}} Adak'
		})
	},
	{
		value: 'Pacific/Honolulu',
		label: getBridgedFunctions()?.t('timezone.pacific_honolulu', {
			value: 'GMT -10:00',
			defaultValue: '{{value}} Hawaii'
		})
	},
	{
		value: 'Pacific/Marquesas',
		label: getBridgedFunctions()?.t('timezone.pacific_marquesas', {
			value: 'GMT -09:30',
			defaultValue: '{{value}} Marquesas'
		})
	},
	{
		value: 'America/Anchorage',
		label: getBridgedFunctions()?.t('timezone.america_anchorage', {
			value: 'GMT -09:00',
			defaultValue: '{{value}} Alaska'
		})
	},
	{
		value: 'America/Los_Angeles',
		label: getBridgedFunctions()?.t('timezone.america_los_angeles', {
			value: 'GMT -08:00',
			defaultValue: '{{value}} US/Canada Pacific'
		})
	},
	{
		value: 'America/Tijuana',
		label: getBridgedFunctions()?.t('timezone.america_tijuana', {
			value: 'GMT -08:00',
			defaultValue: '{{value}} Baja California'
		})
	},
	{
		value: 'America/Chihuahua',
		label: getBridgedFunctions()?.t('timezone.america_chihuahua', {
			value: 'GMT -07:00',
			defaultValue: '{{value}} Chihuahua, La Paz, Mazatlan'
		})
	},
	{
		value: 'America/Denver',
		label: getBridgedFunctions()?.t('timezone.america_denver', {
			value: 'GMT -07:00',
			defaultValue: '{{value}} US/Canada Mountain'
		})
	},
	{
		value: 'America/Fort_Nelson',
		label: getBridgedFunctions()?.t('timezone.america_fort_nelson', {
			value: 'GMT -07:00',
			defaultValue: '{{value}} Fort Nelson'
		})
	},
	{
		value: 'America/Phoenix',
		label: getBridgedFunctions()?.t('timezone.america_phoenix', {
			value: 'GMT -07:00',
			defaultValue: '{{value}} Arizona'
		})
	},
	{
		value: 'America/Whitehorse',
		label: getBridgedFunctions()?.t('timezone.america_whitehorse', {
			value: 'GMT -07:00',
			defaultValue: '{{value}} Yukon'
		})
	},
	{
		value: 'America/Chicago',
		label: getBridgedFunctions()?.t('timezone.america_chicago', {
			value: 'GMT -06:00',
			defaultValue: '{{value}} US/Canada Central'
		})
	},
	{
		value: 'America/Guatemala',
		label: getBridgedFunctions()?.t('timezone.america_guatemala', {
			value: 'GMT -06:00',
			defaultValue: '{{value}} Central America'
		})
	},
	{
		value: 'America/Mexico_City',
		label: getBridgedFunctions()?.t('timezone.america_mexico_city', {
			value: 'GMT -06:00',
			defaultValue: '{{value}} Guadalajara, Mexico City, Monterrey'
		})
	},
	{
		value: 'America/Regina',
		label: getBridgedFunctions()?.t('timezone.america_regina', {
			value: 'GMT -06:00',
			defaultValue: '{{value}} Saskatchewan'
		})
	},
	{
		value: 'Pacific/Easter',
		label: getBridgedFunctions()?.t('timezone.pacific_easter', {
			value: 'GMT -06:00',
			defaultValue: '{{value}} Easter'
		})
	},
	{
		value: 'America/Bogota',
		label: getBridgedFunctions()?.t('timezone.america_bogota', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Colombia'
		})
	},
	{
		value: 'America/Cancun',
		label: getBridgedFunctions()?.t('timezone.america_cancun', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Cancun, Chetumal'
		})
	},
	{
		value: 'America/Grand_Turk',
		label: getBridgedFunctions()?.t('timezone.america_grand_turk', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Turks and Caicos Islands'
		})
	},
	{
		value: 'America/Havana',
		label: getBridgedFunctions()?.t('timezone.america_havana', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Havana'
		})
	},
	{
		value: 'America/Indiana/Indianapolis',
		label: getBridgedFunctions()?.t('timezone.america_indiana_indianapolis', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Indiana (East)'
		})
	},
	{
		value: 'America/New_York',
		label: getBridgedFunctions()?.t('timezone.america_new_york', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} US/Canada Eastern'
		})
	},
	{
		value: 'America/Port-au-Prince',
		label: getBridgedFunctions()?.t('timezone.america_port-au-prince', {
			value: 'GMT -05:00',
			defaultValue: '{{value}} Port-au-Prince'
		})
	},
	{
		value: 'America/Asuncion',
		label: getBridgedFunctions()?.t('timezone.america_asuncion', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Asuncion'
		})
	},
	{
		value: 'America/Caracas',
		label: getBridgedFunctions()?.t('timezone.america_caracas', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Caracas'
		})
	},
	{
		value: 'America/Cuiaba',
		label: getBridgedFunctions()?.t('timezone.america_cuiaba', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Cuiaba'
		})
	},
	{
		value: 'America/Guyana',
		label: getBridgedFunctions()?.t('timezone.america_guyana', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Georgetown, La Paz, Manaus, San Juan'
		})
	},
	{
		value: 'America/Halifax',
		label: getBridgedFunctions()?.t('timezone.america_halifax', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Atlantic Time (Canada)'
		})
	},
	{
		value: 'America/Santiago',
		label: getBridgedFunctions()?.t('timezone.america_santiago', {
			value: 'GMT -04:00',
			defaultValue: '{{value}} Pacific South America'
		})
	},
	{
		value: 'America/St_Johns',
		label: getBridgedFunctions()?.t('timezone.america_st_johns', {
			value: 'GMT -03:30',
			defaultValue: '{{value}} Newfoundland'
		})
	},
	{
		value: 'America/Araguaina',
		label: getBridgedFunctions()?.t('timezone.america_araguaina', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Araguaina'
		})
	},
	{
		value: 'America/Argentina/Buenos_Aires',
		label: getBridgedFunctions()?.t('timezone.america_argentina_buenos_aires', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Argentina'
		})
	},
	{
		value: 'America/Bahia',
		label: getBridgedFunctions()?.t('timezone.america_bahia', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Salvador'
		})
	},
	{
		value: 'America/Cayenne',
		label: getBridgedFunctions()?.t('timezone.america_cayenne', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Cayenne, Fortaleza'
		})
	},
	{
		value: 'America/Miquelon',
		label: getBridgedFunctions()?.t('timezone.america_miquelon', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Miquelon'
		})
	},
	{
		value: 'America/Montevideo',
		label: getBridgedFunctions()?.t('timezone.america_montevideo', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Montevideo'
		})
	},
	{
		value: 'America/Punta_Arenas',
		label: getBridgedFunctions()?.t('timezone.america_punta_arenas', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Punta_Arenas'
		})
	},
	{
		value: 'America/Sao_Paulo',
		label: getBridgedFunctions()?.t('timezone.america_sao_paulo', {
			value: 'GMT -03:00',
			defaultValue: '{{value}} Brasilia'
		})
	},
	{
		value: 'Atlantic/South_Georgia',
		label: getBridgedFunctions()?.t('timezone.atlantic_south_georgia', {
			value: 'GMT -02:00',
			defaultValue: '{{value}} Mid-Atlantic'
		})
	},
	{
		value: 'Atlantic/Azores',
		label: getBridgedFunctions()?.t('timezone.atlantic_azores', {
			value: 'GMT -01:00',
			defaultValue: '{{value}} Azores'
		})
	},
	{
		value: 'Atlantic/Cape_Verde',
		label: getBridgedFunctions()?.t('timezone.atlantic_cape_verde', {
			value: 'GMT -01:00',
			defaultValue: '{{value}} Cape Verde Is.'
		})
	},
	{
		value: 'Africa/Monrovia',
		label: getBridgedFunctions()?.t('timezone.africa_monrovia', {
			value: 'GMT +00:00',
			defaultValue: '{{value}} Monrovia'
		})
	},
	{
		value: 'Africa/Sao_Tome',
		label: getBridgedFunctions()?.t('timezone.africa_sao_tome', {
			value: 'GMT +00:00',
			defaultValue: '{{value}} Sao Tome'
		})
	},
	{
		value: 'Europe/London',
		label: getBridgedFunctions()?.t('timezone.europe_london', {
			value: 'GMT +00:00',
			defaultValue: '{{value}} Britain, Ireland, Portugal'
		})
	},
	{
		value: 'UTC',
		label: getBridgedFunctions()?.t('timezone.utc', {
			value: 'GMT/UTC',
			defaultValue: '{{value}} Coordinated Universal Time'
		})
	},
	{
		value: 'Africa/Algiers',
		label: getBridgedFunctions()?.t('timezone.africa_algiers', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} West Central Africa'
		})
	},
	{
		value: 'Africa/Casablanca',
		label: getBridgedFunctions()?.t('timezone.africa_casablanca', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} Casablanca'
		})
	},
	{
		value: 'Europe/Belgrade',
		label: getBridgedFunctions()?.t('timezone.europe_belgrade', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} Belgrade, Bratislava, Budapest, Ljubljana, Prague'
		})
	},
	{
		value: 'Europe/Berlin',
		label: getBridgedFunctions()?.t('timezone.europe_berlin', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'
		})
	},
	{
		value: 'Europe/Brussels',
		label: getBridgedFunctions()?.t('timezone.europe_brussels', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} Brussels, Copenhagen, Madrid, Paris'
		})
	},
	{
		value: 'Europe/Warsaw',
		label: getBridgedFunctions()?.t('timezone.europe_warsaw', {
			value: 'GMT +01:00',
			defaultValue: '{{value}} Sarajevo, Skopje, Warsaw, Zagreb'
		})
	},
	{
		value: 'Africa/Cairo',
		label: getBridgedFunctions()?.t('timezone.africa_cairo', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Egypt'
		})
	},
	{
		value: 'Africa/Harare',
		label: getBridgedFunctions()?.t('timezone.africa_harare', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Harare, Pretoria'
		})
	},
	{
		value: 'Africa/Juba',
		label: getBridgedFunctions()?.t('timezone.africa_juba', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Juba'
		})
	},
	{
		value: 'Africa/Khartoum',
		label: getBridgedFunctions()?.t('timezone.africa_khartoum', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Khartoum'
		})
	},
	{
		value: 'Africa/Tripoli',
		label: getBridgedFunctions()?.t('timezone.africa_tripoli', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Tripoli'
		})
	},
	{
		value: 'Africa/Windhoek',
		label: getBridgedFunctions()?.t('timezone.africa_windhoek', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Namibia'
		})
	},
	{
		value: 'Asia/Amman',
		label: getBridgedFunctions()?.t('timezone.asia_amman', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Jordan'
		})
	},
	{
		value: 'Asia/Beirut',
		label: getBridgedFunctions()?.t('timezone.asia_beirut', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Beirut'
		})
	},
	{
		value: 'Asia/Damascus',
		label: getBridgedFunctions()?.t('timezone.asia_damascus', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Damascus'
		})
	},
	{
		value: 'Asia/Gaza',
		label: getBridgedFunctions()?.t('timezone.asia_gaza', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Gaza'
		})
	},
	{
		value: 'Asia/Jerusalem',
		label: getBridgedFunctions()?.t('timezone.asia_jerusalem', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Jerusalem'
		})
	},
	{
		value: 'Europe/Athens',
		label: getBridgedFunctions()?.t('timezone.europe_athens', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Athens, Beirut, Bucharest, Istanbul'
		})
	},
	{
		value: 'Europe/Bucharest',
		label: getBridgedFunctions()?.t('timezone.europe_bucharest', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Bucharest'
		})
	},
	{
		value: 'Europe/Chisinau',
		label: getBridgedFunctions()?.t('timezone.europe_chisinau', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Chisinau'
		})
	},
	{
		value: 'Europe/Helsinki',
		label: getBridgedFunctions()?.t('timezone.europe_helsinki', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius'
		})
	},
	{
		value: 'Europe/Kaliningrad',
		label: getBridgedFunctions()?.t('timezone.europe_kaliningrad', {
			value: 'GMT +02:00',
			defaultValue: '{{value}} Kaliningrad (RTZ 1)'
		})
	},
	{
		value: 'Africa/Nairobi',
		label: getBridgedFunctions()?.t('timezone.africa_nairobi', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Nairobi'
		})
	},
	{
		value: 'Asia/Baghdad',
		label: getBridgedFunctions()?.t('timezone.asia_baghdad', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Iraq'
		})
	},
	{
		value: 'Asia/Kuwait',
		label: getBridgedFunctions()?.t('timezone.asia_kuwait', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Kuwait, Riyadh'
		})
	},
	{
		value: 'Europe/Istanbul',
		label: getBridgedFunctions()?.t('timezone.europe_istanbul', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Istanbul'
		})
	},
	{
		value: 'Europe/Minsk',
		label: getBridgedFunctions()?.t('timezone.europe_minsk', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Minsk'
		})
	},
	{
		value: 'Europe/Moscow',
		label: getBridgedFunctions()?.t('timezone.europe_moscow', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Moscow, St. Petersburg, Volgograd (RTZ 2)'
		})
	},
	{
		value: 'Europe/Volgograd',
		label: getBridgedFunctions()?.t('timezone.europe_volgograd', {
			value: 'GMT +03:00',
			defaultValue: '{{value}} Volgograd'
		})
	},
	{
		value: 'Asia/Tehran',
		label: getBridgedFunctions()?.t('timezone.asia_tehran', {
			value: 'GMT +03:30',
			defaultValue: '{{value}} Tehran'
		})
	},
	{
		value: 'Asia/Baku',
		label: getBridgedFunctions()?.t('timezone.asia_baku', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Baku'
		})
	},
	{
		value: 'Asia/Muscat',
		label: getBridgedFunctions()?.t('timezone.asia_muscat', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Abu Dhabi, Muscat'
		})
	},
	{
		value: 'Asia/Tbilisi',
		label: getBridgedFunctions()?.t('timezone.asia_tbilisi', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Tbilisi'
		})
	},
	{
		value: 'Asia/Yerevan',
		label: getBridgedFunctions()?.t('timezone.asia_yerevan', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Yerevan'
		})
	},
	{
		value: 'Europe/Astrakhan',
		label: getBridgedFunctions()?.t('timezone.europe_astrakhan', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Astrakhan'
		})
	},
	{
		value: 'Europe/Samara',
		label: getBridgedFunctions()?.t('timezone.europe_samara', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Izhevsk, Samara (RTZ 3)'
		})
	},
	{
		value: 'Europe/Saratov',
		label: getBridgedFunctions()?.t('timezone.europe_saratov', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Saratov'
		})
	},
	{
		value: 'Indian/Mauritius',
		label: getBridgedFunctions()?.t('timezone.indian_mauritius', {
			value: 'GMT +04:00',
			defaultValue: '{{value}} Port Louis'
		})
	},
	{
		value: 'Asia/Kabul',
		label: getBridgedFunctions()?.t('timezone.asia_kabul', {
			value: 'GMT +04:30',
			defaultValue: '{{value}} Kabul'
		})
	},
	{
		value: 'Asia/Karachi',
		label: getBridgedFunctions()?.t('timezone.asia_karachi', {
			value: 'GMT +05:00',
			defaultValue: '{{value}} Islamabad, Karachi'
		})
	},
	{
		value: 'Asia/Qyzylorda',
		label: getBridgedFunctions()?.t('timezone.asia_qyzylorda', {
			value: 'GMT +05:00',
			defaultValue: '{{value}} Qyzylorda'
		})
	},
	{
		value: 'Asia/Tashkent',
		label: getBridgedFunctions()?.t('timezone.asia_tashkent', {
			value: 'GMT +05:00',
			defaultValue: '{{value}} Tashkent'
		})
	},
	{
		value: 'Asia/Yekaterinburg',
		label: getBridgedFunctions()?.t('timezone.asia_yekaterinburg', {
			value: 'GMT +05:00',
			defaultValue: '{{value}} Ekaterinburg (RTZ 4)'
		})
	},
	{
		value: 'Asia/Colombo',
		label: getBridgedFunctions()?.t('timezone.asia_colombo', {
			value: 'GMT +05:30',
			defaultValue: '{{value}} Sri Jayawardenepura Kotte'
		})
	},
	{
		value: 'Asia/Kolkata',
		label: getBridgedFunctions()?.t('timezone.asia_kolkata', {
			value: 'GMT +05:30',
			defaultValue: '{{value}} Chennai, Kolkata, Mumbai, New Delhi'
		})
	},
	{
		value: 'Asia/Kathmandu',
		label: getBridgedFunctions()?.t('timezone.asia_kathmandu', {
			value: 'GMT +05:45',
			defaultValue: '{{value}} Kathmandu'
		})
	},
	{
		value: 'Asia/Almaty',
		label: getBridgedFunctions()?.t('timezone.asia_almaty', {
			value: 'GMT +06:00',
			defaultValue: '{{value}} Astana'
		})
	},
	{
		value: 'Asia/Dhaka',
		label: getBridgedFunctions()?.t('timezone.asia_dhaka', {
			value: 'GMT +06:00',
			defaultValue: '{{value}} Dhaka'
		})
	},
	{
		value: 'Asia/Omsk',
		label: getBridgedFunctions()?.t('timezone.asia_omsk', {
			value: 'GMT +06:00',
			defaultValue: '{{value}} Omsk'
		})
	},
	{
		value: 'Asia/Yangon',
		label: getBridgedFunctions()?.t('timezone.asia_yangon', {
			value: 'GMT +06:30',
			defaultValue: '{{value}} Yangon'
		})
	},
	{
		value: 'Asia/Bangkok',
		label: getBridgedFunctions()?.t('timezone.asia_bangkok', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Bangkok, Hanoi, Jakarta'
		})
	},
	{
		value: 'Asia/Barnaul',
		label: getBridgedFunctions()?.t('timezone.asia_barnaul', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Barnaul'
		})
	},
	{
		value: 'Asia/Hovd',
		label: getBridgedFunctions()?.t('timezone.asia_hovd', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Hovd'
		})
	},
	{
		value: 'Asia/Krasnoyarsk',
		label: getBridgedFunctions()?.t('timezone.asia_krasnoyarsk', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Krasnoyarsk (RTZ 6)'
		})
	},
	{
		value: 'Asia/Novosibirsk',
		label: getBridgedFunctions()?.t('timezone.asia_novosibirsk', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Novosibirsk (RTZ 5)'
		})
	},
	{
		value: 'Asia/Tomsk',
		label: getBridgedFunctions()?.t('timezone.asia_tomsk', {
			value: 'GMT +07:00',
			defaultValue: '{{value}} Tomsk'
		})
	},
	{
		value: 'Asia/Hong_Kong',
		label: getBridgedFunctions()?.t('timezone.asia_hong_kong', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Beijing, Chongqing, Hong Kong, Urumqi'
		})
	},
	{
		value: 'Asia/Irkutsk',
		label: getBridgedFunctions()?.t('timezone.asia_irkutsk', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Irkutsk (RTZ 7)'
		})
	},
	{
		value: 'Asia/Kuala_Lumpur',
		label: getBridgedFunctions()?.t('timezone.asia_kuala_lumpur', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Kuala Lumpur'
		})
	},
	{
		value: 'Asia/Singapore',
		label: getBridgedFunctions()?.t('timezone.asia_singapore', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Singapore'
		})
	},
	{
		value: 'Asia/Taipei',
		label: getBridgedFunctions()?.t('timezone.asia_taipei', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Taipei'
		})
	},
	{
		value: 'Asia/Ulaanbaatar',
		label: getBridgedFunctions()?.t('timezone.asia_ulaanbaatar', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Ulaanbaatar'
		})
	},
	{
		value: 'Australia/Perth',
		label: getBridgedFunctions()?.t('timezone.australia_perth', {
			value: 'GMT +08:00',
			defaultValue: '{{value}} Perth'
		})
	},
	{
		value: 'Australia/Eucla',
		label: getBridgedFunctions()?.t('timezone.australia_eucla', {
			value: 'GMT +08:45',
			defaultValue: '{{value}} Eucla'
		})
	},
	{
		value: 'Asia/Chita',
		label: getBridgedFunctions()?.t('timezone.asia_chita', {
			value: 'GMT +09:00',
			defaultValue: '{{value}} Chita'
		})
	},
	{
		value: 'Asia/Pyongyang',
		label: getBridgedFunctions()?.t('timezone.asia_pyongyang', {
			value: 'GMT +09:00',
			defaultValue: '{{value}} Pyongyang'
		})
	},
	{
		value: 'Asia/Seoul',
		label: getBridgedFunctions()?.t('timezone.asia_seoul', {
			value: 'GMT +09:00',
			defaultValue: '{{value}} Korea'
		})
	},
	{
		value: 'Asia/Tokyo',
		label: getBridgedFunctions()?.t('timezone.asia_tokyo', {
			value: 'GMT +09:00',
			defaultValue: '{{value}} Japan'
		})
	},
	{
		value: 'Asia/Yakutsk',
		label: getBridgedFunctions()?.t('timezone.asia_yakutsk', {
			value: 'GMT +09:00',
			defaultValue: '{{value}} Yakutsk (RTZ 8)'
		})
	},
	{
		value: 'Australia/Adelaide',
		label: getBridgedFunctions()?.t('timezone.australia_adelaide', {
			value: 'GMT +09:30',
			defaultValue: '{{value}} Adelaide'
		})
	},
	{
		value: 'Australia/Darwin',
		label: getBridgedFunctions()?.t('timezone.australia_darwin', {
			value: 'GMT +09:30',
			defaultValue: '{{value}} Darwin'
		})
	},
	{
		value: 'Asia/Vladivostok',
		label: getBridgedFunctions()?.t('timezone.asia_vladivostok', {
			value: 'GMT +10:00',
			defaultValue: '{{value}} Vladivostok, Magadan (RTZ 9)'
		})
	},
	{
		value: 'Australia/Brisbane',
		label: getBridgedFunctions()?.t('timezone.australia_brisbane', {
			value: 'GMT +10:00',
			defaultValue: '{{value}} Brisbane'
		})
	},
	{
		value: 'Australia/Hobart',
		label: getBridgedFunctions()?.t('timezone.australia_hobart', {
			value: 'GMT +10:00',
			defaultValue: '{{value}} Hobart'
		})
	},
	{
		value: 'Australia/Sydney',
		label: getBridgedFunctions()?.t('timezone.australia_sydney', {
			value: 'GMT +10:00',
			defaultValue: '{{value}} Canberra, Melbourne, Sydney'
		})
	},
	{
		value: 'Pacific/Guam',
		label: getBridgedFunctions()?.t('timezone.pacific_guam', {
			value: 'GMT +10:00',
			defaultValue: '{{value}} Guam, Port Moresby'
		})
	},
	{
		value: 'Australia/Lord_Howe',
		label: getBridgedFunctions()?.t('timezone.australia_lord_howe', {
			value: 'GMT +10:30',
			defaultValue: '{{value}} Lord_Howe'
		})
	},
	{
		value: 'Asia/Magadan',
		label: getBridgedFunctions()?.t('timezone.asia_magadan', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Magadan'
		})
	},
	{
		value: 'Asia/Sakhalin',
		label: getBridgedFunctions()?.t('timezone.asia_sakhalin', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Sakhalin'
		})
	},
	{
		value: 'Asia/Srednekolymsk',
		label: getBridgedFunctions()?.t('timezone.asia_srednekolymsk', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Chokurdakh (RTZ 10)'
		})
	},
	{
		value: 'Pacific/Bougainville',
		label: getBridgedFunctions()?.t('timezone.pacific_bougainville', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Bougainville Standard Time'
		})
	},
	{
		value: 'Pacific/Guadalcanal',
		label: getBridgedFunctions()?.t('timezone.pacific_guadalcanal', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Solomon Is. / New Caledonia'
		})
	},
	{
		value: 'Pacific/Norfolk',
		label: getBridgedFunctions()?.t('timezone.pacific_norfolk', {
			value: 'GMT +11:00',
			defaultValue: '{{value}} Norfolk'
		})
	},
	{
		value: 'Asia/Kamchatka',
		label: getBridgedFunctions()?.t('timezone.asia_kamchatka', {
			value: 'GMT +12:00',
			defaultValue: '{{value}} Anadyr, Petropavlovsk-Kamchatsky (RTZ 11)'
		})
	},
	{
		value: 'Pacific/Auckland',
		label: getBridgedFunctions()?.t('timezone.pacific_auckland', {
			value: 'GMT +12:00',
			defaultValue: '{{value}} New Zealand'
		})
	},
	{
		value: 'Pacific/Fiji',
		label: getBridgedFunctions()?.t('timezone.pacific_fiji', {
			value: 'GMT +12:00',
			defaultValue: '{{value}} Fiji'
		})
	},
	{
		value: 'Pacific/Chatham',
		label: getBridgedFunctions()?.t('timezone.pacific_chatham', {
			value: 'GMT +12:45',
			defaultValue: '{{value}} Chatham'
		})
	},
	{
		value: 'Pacific/Apia',
		label: getBridgedFunctions()?.t('timezone.pacific_apia', {
			value: 'GMT +13:00',
			defaultValue: '{{value}} Samoa'
		})
	},
	{
		value: 'Pacific/Tongatapu',
		label: getBridgedFunctions()?.t('timezone.pacific_tongatapu', {
			value: 'GMT +13:00',
			defaultValue: '{{value}} Nuku’alofa'
		})
	},
	{
		value: 'Pacific/Kiritimati',
		label: getBridgedFunctions()?.t('timezone.pacific_kiritimati', {
			value: 'GMT +14:00',
			defaultValue: '{{value}} Kiritimati Island'
		})
	}
];
