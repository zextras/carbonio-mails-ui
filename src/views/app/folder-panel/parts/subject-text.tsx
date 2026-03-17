/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Text } from '@zextras/carbonio-design-system';

import { useListItemTextSubject } from '../../../../hooks/use-list-item-text-subject';

export const SubjectText = ({
	read,
	subject
}: {
	read: boolean;
	subject: string;
}): React.JSX.Element => {
	const subjectText = useListItemTextSubject(subject);

	const weight = useMemo<'bold' | 'regular'>(() => {
		if (read === undefined) return 'regular';
		return read ? 'regular' : 'bold';
	}, [read]);
	return (
		<Text data-testid="Subject" weight={weight} color={subject ? 'text' : 'secondary'}>
			{subjectText}
		</Text>
	);
};
