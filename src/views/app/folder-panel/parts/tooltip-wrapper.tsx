/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Tooltip } from '@zextras/carbonio-design-system';

type TooltipWrapperProps = {
	children: ReactElement;
	enabled: boolean;
	label: string;
	maxWidth?: string;
};

export const TooltipWrapper = ({
	children,
	enabled,
	label,
	maxWidth
}: TooltipWrapperProps): ReactElement =>
	enabled ? (
		<Tooltip label={label} disabled={!enabled} maxWidth={maxWidth}>
			{children}
		</Tooltip>
	) : (
		children
	);
