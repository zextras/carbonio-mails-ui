/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useContext } from 'react';

import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';

export const useIsFilePreviewOpen = (): boolean => {
	const previewContext = useContext(PreviewsManagerContext);
	return previewContext.currentIndex >= 0;
};
