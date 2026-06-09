/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AdvancedFilterModalProps } from 'views/search/types/types';

export const defaultProps: AdvancedFilterModalProps = {
	isSharedFolderIncluded: false,
	onClose: vi.fn(),
	query: [],
	onSearchConfirm: vi.fn()
};
