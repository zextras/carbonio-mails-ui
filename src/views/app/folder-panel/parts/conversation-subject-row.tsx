/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { showFragment } from './utils/utils';

function cleanSubject(subject: string): string {
	return subject.replace(/^(RE:|FWD:)\s*/i, '').trim();
}

export const ConversationSubjectRow = ({
	subject,
	fragment,
	read
}: {
	subject: string;
	fragment: string;
	read: boolean;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const subjectText = useMemo(
		() => cleanSubject(subject) || t('label.no_subject_with_tags', '<No Subject>'),
		[subject, t]
	);

	const subFragmentTooltipLabel = useMemo(
		() => (showFragment(fragment) ? fragment : subject),
		[fragment, subject]
	);

	const weight = useMemo<'bold' | 'regular'>(() => {
		if (typeof read === 'undefined') return 'regular';
		return read ? 'regular' : 'bold';
	}, [read]);

	return (
		<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
			<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" crossAlignment="baseline">
				<Text data-testid="Subject" weight={weight} color={subject ? 'text' : 'secondary'}>
					{subjectText}
				</Text>
			</Row>
		</Tooltip>
	);
};
