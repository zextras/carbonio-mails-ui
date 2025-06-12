/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@emotion/react';
import { Theme as DSTheme } from '@zextras/carbonio-design-system';

// Add module augmentation for Emotion theme
declare module '@emotion/react' {
	export type Theme = DSTheme;
}
