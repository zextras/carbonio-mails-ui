/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Text } from '@zextras/carbonio-design-system';

import { useListItemTextSubject } from '../../../../hooks/use-list-item-text-subject';
import { NormalizedConversation } from '../../../../types';
import { isItemRead } from './utils/utils';

export const SubjectText = ({
	read,
	subject
}: {
	read: NormalizedConversation['read'];
	subject: NormalizedConversation['subject'];
}): React.JSX.Element => {
	const subjectText = useListItemTextSubject(subject);
	return (
		<Text
			data-testid="Subject"
			weight={isItemRead(read) ? 'regular' : 'bold'}
			color={subject ? 'text' : 'secondary'}
		>
			{subjectText}
		</Text>
	);
};
