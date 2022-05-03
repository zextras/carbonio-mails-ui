/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */
import { isEqual, transform, isObject, filter, reduce } from 'lodash';

export const differenceObject = (object, base) => {
	// eslint-disable-next-line no-shadow
	function changes(object, base) {
		return transform(object, (result, value, key) => {
			if (!isEqual(value, base[key])) {
				// eslint-disable-next-line no-param-reassign
				result[key] = isObject(value) && isObject(base[key]) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
};

export const getPropsDiff = (original, modified) =>
	reduce(
		Object.keys(modified),
		(acc, v) => {
			if (original?.[v]?.value === modified?.[v]?.value) {
				return acc;
			}
			return { ...acc, [v]: modified[v] };
		},
		{}
	);

export const CheckNewMailOptions = (t, isSecondsFormat, isMinutesFormat) => [
	{
		label: t('settings.new_mail_optn.manually', 'Manually'),
		value: isMinutesFormat ? '31536000' : isSecondsFormat ? '31536000s' : '31536000'
	},
	{
		label: t('settings.new_mail_optn.when_arrive', 'As new e-mail arrives'),
		value: isMinutesFormat ? '500' : isSecondsFormat ? '500s' : '500'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 1,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '1m' : isSecondsFormat ? '60s' : '60'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 2,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '2m' : isSecondsFormat ? '120s' : '120'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 3,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '3m' : isSecondsFormat ? '180s' : '180'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 4,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '4m' : isSecondsFormat ? '240s' : '240'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 5,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '5m' : isSecondsFormat ? '300s' : '300'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 6,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '6m' : isSecondsFormat ? '360s' : '360'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 7,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '7m' : isSecondsFormat ? '420s' : '420'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 8,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '8m' : isSecondsFormat ? '480s' : '480'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 9,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '9m' : isSecondsFormat ? '540s' : '540'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 10,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '10m' : isSecondsFormat ? '600s' : '600'
	},
	{
		label: t('settings.new_mail_optn.minute', {
			count: 15,
			defaultValue: '{{count}} minute',
			defaultValue_plural: '{{count}} minutes'
		}),
		value: isMinutesFormat ? '15m' : isSecondsFormat ? '900s' : '900'
	}
];
export const DisplayMailOptions = (t) => [
	{ label: t('settings.display_mail_options.html', 'As HTML(When Possible)'), value: 'TRUE' },
	{ label: t('settings.display_mail_options.text', 'As text'), value: 'FALSE' }
];

export const MessageSelectionOptions = (t) => [
	{
		label: t(
			'settings.msg_selection_optn.below_deleted',
			'Select messages below the deleted or moved  messages'
		),
		value: 'next'
	},
	{
		label: t(
			'settings.msg_selection_optn.above_deleted',
			'Select messages above the deleted or moved  messages'
		),
		value: 'previous'
	},
	{
		label: t(
			'settings.msg_selection_optn.based_on_previous',
			'Select next message based on previous selections'
		),
		value: 'adaptive'
	}
];

export const NotifyFolderOpts = (t) => [
	{
		label: t(
			'settings.notify_folder_optn.new_message_inbox',
			'Display notifications for new messages that arrive in inbox'
		),
		value: 'FALSE'
	},
	{
		label: t(
			'settings.notify_folder_optn.new_message_folder',
			'Display notifications for new messages that arrive in any folder'
		),
		value: 'TRUE'
	}
];

export const ReadReceiptOpts = (t) => [
	{ label: t('settings.read_rcpt_optn.never', 'Never send a read reciept'), value: 'never' },
	{ label: t('settings.read_rcpt_optn.always', 'Always send a read reciept'), value: 'always' },
	{ label: t('settings.read_rcpt_optn.ask_me', 'Ask me'), value: 'prompt' }
];

export const MsgsFromMeOpts = (t) => [
	{ label: t('settings.msg_from_optn.inbox', 'Place in inbox'), value: 'dedupeNone' },
	{
		label: t('settings.msg_from_optn.inbox_if_cc', "Place in inbox if I'm in To: or Cc:"),
		value: 'secondCopyifOnToOrCC'
	},
	{
		label: t('settings.msg_from_optn.discard', 'Discard message automatically'),
		value: 'dedupeAll'
	}
];

export const ReadSignatureSettings = (t) => [
	{ label: t('settings.msg_from_optn.inbox', 'Place in inbox'), value: 'dedupeNone' },
	{
		label: t('settings.msg_from_optn.inbox_if_cc', "Place in inbox if I'm in To: or Cc:"),
		value: 'secondCopyifOnToOrCC'
	},
	{
		label: t('settings.msg_from_optn.discard', 'Discard message automatically'),
		value: 'dedupeAll'
	}
];

export const ConversationSortingSettings = (t) => [
	{ label: t('settings.conv_sort_option.desc', 'From new to old'), value: 'dateDesc' },
	{ label: t('settings.conv_sort_option.asc', 'From old to new'), value: 'dateAsc' }
];

export const findLabel = (list, value) => filter(list, (item) => item.value === value)[0]?.label;
