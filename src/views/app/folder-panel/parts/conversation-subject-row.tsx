/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { SubjectText } from './subject-text';
import { SubjectTooltip } from './subject-tooltip';

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

	return (
		<SubjectTooltip fragment={fragment} subjectText={subjectText}>
			<SubjectText text={subjectText} read={read} />
		</SubjectTooltip>
	);
};
