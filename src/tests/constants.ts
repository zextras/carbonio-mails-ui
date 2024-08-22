/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
	}
};

export const TESTID_SELECTORS = {
	icons: {
		attachmentDropdown: 'icon: AttachOutline',
		chevronDown: 'icon: ChevronDownOutline',
		layoutVerticalSplit: 'icon: LayoutOutline',
		layoutHorizontalSplit: 'icon: BottomViewOutline',
		layoutNoSplit: 'icon: ViewOffOutline',
		navigateNext: 'icon: ArrowIosForward',
		navigatePrevious: 'icon: ArrowIosBack'
	},

	signatureEditor: 'signature-editor',
	signaturesList: 'signatures-list'
};
