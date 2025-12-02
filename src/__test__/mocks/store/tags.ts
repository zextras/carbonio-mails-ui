/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useTagStore } from '@zextras/carbonio-ui-commons';

/**
 * Initialize the tags store with empty state for testing
 */
export const populateTagsStore = (): void => {
	useTagStore.setState(
		{
			tags: {}
		},
		true
	);
};
