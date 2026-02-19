/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';

export const FOLDERS_DESCRIPTORS = {
	userRoot: {
		id: FOLDERS.USER_ROOT,
		desc: 'user root'
	},
	inbox: {
		id: FOLDERS.INBOX,
		desc: 'inbox'
	},
	sent: {
		id: FOLDERS.SENT,
		desc: 'sent'
	},
	draft: {
		id: FOLDERS.DRAFTS,
		desc: 'drafts'
	},
	spam: {
		id: FOLDERS.SPAM,
		desc: 'junk'
	},
	trash: {
		id: FOLDERS.TRASH,
		desc: 'trash'
	},
	userDefined: {
		id: '1234567',
		desc: 'user defined'
	},
	contacts: {
		id: FOLDERS.CONTACTS,
		desc: 'contacts'
	},
	autoContacts: {
		id: FOLDERS.AUTO_CONTACTS,
		desc: 'emailed contacts'
	},
	calendar: {
		id: FOLDERS.CALENDAR,
		desc: 'calendar'
	}
};
export const MSG_CONV_STATUS_DESCRIPTORS = {
	FLAGGED: {
		value: true,
		desc: 'flagged'
	},
	NOT_FLAGGED: {
		value: false,
		desc: 'not flagged'
	},
	READ: {
		value: true,
		desc: 'read'
	},
	NOT_READ: {
		value: false,
		desc: 'not read'
	}
};
export const ASSERTIONS = {
	IS_VISIBLE: {
		value: true,
		desc: 'is visible'
	},
	IS_NOT_VISIBLE: {
		value: false,
		desc: 'is not visible'
	},
	CONTAINS: {
		value: true,
		desc: 'contains'
	},
	NOT_CONTAINS: {
		value: false,
		desc: 'not contains'
	},
	IS: {
		value: true,
		desc: 'is'
	},
	IS_NOT: {
		value: false,
		desc: "isn't"
	}
};
export const TESTID_SELECTORS = {
	icons: {
		attachmentDropdown: 'icon: AttachOutline',
		chevronDown: 'icon: ChevronDownOutline',
		chevronUp: 'icon: ChevronUpOutline',
		layoutVerticalSplit: 'icon: LayoutOutline',
		layoutHorizontalSplit: 'icon: BottomViewOutline',
		layoutNoSplit: 'icon: ViewOffOutline',
		navigateNext: 'icon: ArrowIosForward',
		navigatePrevious: 'icon: ArrowIosBack',
		trash: 'icon: Trash2Outline',
		deletePermanently: 'icon: DeletePermanentlyOutline',
		deleteDraft: 'icon: Trash2Outline',
		square: 'icon: Square',
		tag: 'icon: Tag',
		tagsMore: 'icon: TagsMoreOutline',
		flag: 'icon: Flag',
		archive: 'icon: ArchiveOutline'
	},
	composer: {
		attachmentAddOriginal: 'composer.attachment.add_original'
	},
	signatureEditor: 'signature-editor',
	signaturesList: 'signatures-list'
};
export const TIMERS = {
	modal_open_delay: 10
};
