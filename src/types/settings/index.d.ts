/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type PrefsType = {
	zimbraPrefCalendarReminderMobile: string;
	zimbraPrefIMLogChats: string;
	zimbraPrefFileSharingApplication: string;
	zimbraPrefCalendarWorkingHours: string;
	zimbraPrefCalendarViewTimeInterval: string;
	zimbraPrefDefaultCalendarId: string;
	zimbraPrefDefaultSignatureId: string;
	zimbraPrefComposeFormat: string;
	zimbraPrefZmgPushNotificationEnabled: string;
	zimbraPrefDisplayTimeInMailList: string;
	zimbraPrefIMNotifyStatus: string;
	zimbraPrefLocale: string;
	zimbraPrefIMReportIdle: string;
	zimbraPrefSaveToSent: string;
	zimbraPrefDisplayExternalImages: string;
	zimbraPrefOutOfOfficeCacheDuration: string;
	zimbraPrefConvReadingPaneLocation: string;
	zimbraPrefMailTrustedSenderList: string | Array<string>;
	zimbraPrefShowSearchString: string;
	zimbraPrefMailSelectAfterDelete: string;
	zimbraPrefAppleIcalDelegationEnabled: string;
	zimbraPrefHtmlEditorDefaultFontFamily: string;
	zimbraPrefConvShowCalendar: string;
	zimbraPrefCalendarShowPastDueReminders: string;
	zimbraPrefWarnOnExit: string;
	zimbraPrefReadingPaneEnabled: string;
	zimbraPrefIMToasterEnabled: string;
	zimbraPrefOutOfOfficeStatusAlertOnLogin: string;
	zimbraPrefAutocompleteAddressBubblesEnabled: string;
	zimbraPrefContactsInitialView: string;
	zimbraPrefVoiceItemsPerPage: string;
	zimbraPrefMailToasterEnabled: string;
	zimbraPrefForwardReplyInOriginalFormat: string;
	zimbraPrefSortOrder: string;
	zimbraPrefBriefcaseReadingPaneLocation: string;
	zimbraPrefContactsPerPage: string;
	zimbraPrefMarkMsgRead: string;
	zimbraPrefMessageIdDedupingEnabled: string;
	zimbraPrefCalendarApptReminderWarningTime: string;
	zimbraPrefCalendarReminderYMessenger: string;
	zimbraPrefDeleteInviteOnReply: string;
	zimbraPrefCalendarDefaultApptDuration: string;
	zimbraPrefCalendarDayHourStart: string;
	zimbraPrefPop3DeleteOption: string;
	zimbraPrefTabInEditorEnabled: string;
	zimbraPrefCalendarAutoAddInvites: string;
	zimbraPrefExternalSendersType: string;
	zimbraPrefContactsDisableAutocompleteOnContactGroupMembers: string;
	zimbraPrefIMFlashTitle: string;
	zimbraPrefSentLifetime: string;
	zimbraPrefAutoCompleteQuickCompletionOnComma: string;
	zimbraPrefImapEnabled: string;
	zimbraPrefMailFlashIcon: string;
	zimbraPrefMailSoundsEnabled: string;
	zimbraPrefFolderColorEnabled: string;
	zimbraPrefIMSoundsEnabled: string;
	zimbraPrefGalAutoCompleteEnabled: string;
	zimbraPrefIMHideBlockedBuddies: string;
	zimbraPrefUseSendMsgShortcut: string;
	zimbraPrefCalendarReminderSoundsEnabled: string;
	zimbraPrefCalendarShowDeclinedMeetings: string;
	zimbraPrefIMInstantNotify: string;
	zimbraPrefMailInitialSearch: string;
	zimbraPrefIMNotifyPresence: string;
	zimbraPrefMandatorySpellCheckEnabled: string;
	zimbraPrefDedupeMessagesSentToSelf: string;
	zimbraPrefHtmlEditorDefaultFontSize: string;
	zimbraPrefSentMailFolder: string;
	zimbraPrefCalendarApptVisibility: string;
	zimbraPrefCalendarDayHourEnd: string;
	zimbraPrefShowComposeDirection: string;
	zimbraPrefShowCalendarWeek: string;
	zimbraPrefClientType: string;
	zimbraPrefIMAutoLogin: string;
	zimbraPrefCalendarAlwaysShowMiniCal: string;
	zimbraPrefChatPlaySound: string;
	zimbraPrefHtmlEditorDefaultFontColor: string;
	zimbraPrefTasksReadingPaneLocation: string;
	zimbraPrefItemsPerVirtualPage: string;
	zimbraPrefSearchTreeOpen: string;
	zimbraPrefStandardClientAccessibilityMode: string;
	zimbraPrefUseRfc2231: string;
	zimbraPrefCalendarNotifyDelegatedChanges: string;
	zimbraPrefShowChatsFolderInMail: string;
	zimbraPrefConversationOrder: string;
	zimbraPrefMailSignature: string;
	zimbraPrefIncludeSharedItemsInSearch: string;
	zimbraPrefPop3Enabled: string;
	zimbraPrefShowSelectionCheckbox: string;
	zimbraPrefDelegatedSendSaveTarget: string;
	zimbraPrefPop3IncludeSpam: string;
	zimbraPrefCalendarReminderFlashTitle: string;
	zimbraPrefDefaultPrintFontSize: string;
	zimbraPrefMessageViewHtmlPreferred: string;
	zimbraPrefMailFlashTitle: string;
	zimbraPrefMailPollingInterval: string;
	zimbraPrefFontSize: string;
	zimbraPrefIMLogChatsEnabled: string;
	zimbraPrefReplyIncludeOriginalText: string;
	zimbraPrefIncludeTrashInSearch: string;
	zimbraPrefSharedAddrBookAutoCompleteEnabled: string;
	zimbraPrefCalendarAllowCancelEmailToSelf: string;
	zimbraPrefCalendarAllowPublishMethodInvite: string;
	zimbraPrefIMIdleStatus: string;
	zimbraPrefGroupMailBy: string;
	zimbraPrefCalendarAllowForwardedInvite: string;
	zimbraPrefZimletTreeOpen: string;
	zimbraPrefCalendarUseQuickAdd: string;
	zimbraPrefComposeInNewWindow: string;
	zimbraPrefGalSearchEnabled: string;
	zimbraPrefJunkLifetime: string;
	zimbraPrefSpellIgnoreAllCaps: string;
	zimbraPrefUseTimeZoneListInCalendar: string;
	zimbraPrefCalendarAllowedTargetsForInviteDeniedAutoReply: string;
	zimbraPrefOpenMailInNewWindow: string;
	zimbraPrefMailSignatureStyle: string;
	zimbraPrefAdminConsoleWarnOnExit: string;
	zimbraPrefTrashLifetime: string;
	zimbraPrefShowFragments: string;
	zimbraPrefContactsExpandAppleContactGroups: string;
	zimbraPrefOutOfOfficeReplyEnabled: string;
	zimbraPrefIMFlashIcon: string;
	zimbraPrefMailRequestReadReceipts: string;
	zimbraPrefCalendarReminderDuration1: string;
	zimbraPrefAdvancedClientEnforceMinDisplay: string;
	zimbraPrefCalendarFirstDayOfWeek: string;
	zimbraPrefSkin: string;
	zimbraPrefForwardReplyPrefixChar: string;
	zimbraPrefShowAllNewMailNotifications: string;
	zimbraPrefAccountTreeOpen: string;
	zimbraPrefAutoSaveDraftInterval: string;
	zimbraPrefCalendarToasterEnabled: string;
	zimbraPrefColorMessagesEnabled: string;
	zimbraPrefCalendarApptAllowAtendeeEdit: string;
	zimbraPrefIncludeSpamInSearch: string;
	zimbraPrefOutOfOfficeFreeBusyStatus: string;
	zimbraPrefCalendarInitialView: string;
	zimbraPrefFolderTreeOpen: string;
	zimbraPrefInboxUnreadLifetime: string;
	zimbraPrefImapSearchFoldersEnabled: string;
	zimbraPrefMailSendReadReceipts: string;
	zimbraPrefForwardIncludeOriginalText: string;
	zimbraPrefMailItemsPerPage: string;
	zimbraPrefUseKeyboardShortcuts: string;
	zimbraPrefTimeZoneId: string;
	zimbraPrefShortEmailAddress: string;
	zimbraPrefIMHideOfflineBuddies: string;
	zimbraPrefChatEnabled: string;
	zimbraPrefInboxReadLifetime: string;
	zimbraPrefOutOfOfficeExternalReplyEnabled: string;
	zimbraPrefTagTreeOpen: string;
	zimbraPrefGetMailAction: string;
	zimbraPrefAutoAddAddressEnabled: string;
	zimbraPrefReadingPaneLocation: string;
	zimbraPrefOutOfOfficeSuppressExternalReply: string;
	zimbraPrefCalendarReminderSendEmail: string;
	zimbraPrefCalendarSendInviteDeniedAutoReply: string;
	zimbraPrefIMIdleTimeout: string;
	zimbraPrefCalenderScaling: string;
	zimbraPrefNewMailNotificationAddress?: string;
	zimbraPrefForwardReplySignatureId?: string;
};

export type PropsType = {
	mailNotificationSound: { value: boolean | string };
};

export type UpdateSettingsProps = {
	target: {
		name: string;
		value: string | Array<string> | undefined;
	};
};

export type InputProps = {
	settingsObj: PrefsType;
	updateSettings: (arg: UpdateSettingsProps) => void;
};

export type SignItemType = {
	name: string;
	id: string;
	description: string;
	label: string;
	content?: [
		{
			type: 'text/plain' | 'text/html';
			_content: string;
		}
	];
};

type IdentityProps = {
	zimbraPrefForwardReplySignatureId: string;
	zimbraPrefWhenSentToEnabled: string;
	zimbraPrefWhenInFoldersEnabled: string;
	zimbraPrefFromAddressType: string;
	objectClass: string;
	zimbraPrefFromAddress: string;
	zimbraPrefFromDisplay: string;
	zimbraPrefIdentityId: string;
	zimbraPrefDefaultSignatureId: string;
	zimbraCreateTimestamp: string;
	zimbraPrefIdentityName: string;
	zimbraPrefReplyToEnabled: string;
};

type AccountIdentity = {
	name: string;
	id: string;
	_attrs: IdentityProps;
};
type SignatureSettingsPropsType = {
	updatedIdentities: AccountIdentity[];
	updateIdentities: (arg: {
		target: {
			name: string;
			value: string;
		};
	}) => void;
	setDisabled: (arg: boolean) => void;
	signatures: SignItemType[];
	setSignatures: (signatures: SignItemType[]) => void;
	setOriginalSignatures: (signatures: SignItemType[]) => void;
};

export type ReceivingMessagesSettingsType = {
	settingsObj: PrefsType;
	updateSettings: (arg: UpdateSettingsProps) => void;
	updatedProps: PropsType | any;
	updateProps: (arg: UpdateSettingsProps) => void;
};

export type DisplayingMessagesSettingsProps = {
	settingsObj: Record<string, string>;
	updateSettings: (arg: UpdateSettingsProps) => void;
	updatedProps: PropsType | any;
	updateProps: (arg: UpdateSettingsProps) => void;
};
