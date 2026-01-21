/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Text } from '@zextras/carbonio-design-system';

export const SubjectText = ({ read, text }: { read: boolean; text: string }): React.JSX.Element => {
	const weight = useMemo<'bold' | 'regular'>(() => {
		if (typeof read === 'undefined') return 'regular';
		return read ? 'regular' : 'bold';
	}, [read]);
	return (
		<Text data-testid="Subject" weight={weight} color={text ? 'text' : 'secondary'}>
			{text}
		</Text>
	);
};
