/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui';

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

export const FOLDERS_DESCRIPTORS = {
	INBOX: {
		id: FOLDERS.INBOX,
		desc: 'inbox'
	},
	SENT: {
		id: FOLDERS.SENT,
		desc: 'sent'
	},
	DRAFTS: {
		id: FOLDERS.DRAFTS,
		desc: 'drafts'
	},
	SPAM: {
		id: FOLDERS.SPAM,
		desc: 'junk'
	},
	TRASH: {
		id: FOLDERS.TRASH,
		desc: 'trash'
	},
	USER_DEFINED: {
		id: '1234567',
		desc: 'user defined'
	}
};

export const CONTAIN_ASSERTION = {
	CONTAIN: {
		value: true,
		desc: 'contain'
	},
	NOT_CONTAIN: {
		value: false,
		desc: 'not contain'
	}
};

export const VISIBILITY_ASSERTION = {
	IS_VISIBLE: {
		value: true,
		desc: 'is visible'
	},
	IS_NOT_VISIBLE: {
		value: false,
		desc: 'is not visible'
	}
};
