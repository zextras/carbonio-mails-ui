/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageFragment } from './message-fragment';
import { SubjectText } from './subject-text';
import { SubjectTooltip } from './subject-tooltip';

export const MessageSubjectRow = ({
	subject,
	fragment,
	read,
	isConvChildren
}: {
	subject: string;
	fragment: string | undefined;
	read: boolean;
	isConvChildren: boolean;
}): React.JSX.Element => {
	const [t] = useTranslation();

	const subjectText = useMemo(
		() => subject || t('label.no_subject_with_tags', '<No Subject>'),
		[subject, t]
	);

	return (
		<SubjectTooltip subjectText={subjectText} fragment={fragment}>
			{!isConvChildren && <SubjectText text={subjectText} read={read} />}
			<MessageFragment isConvChildren={isConvChildren} fragment={fragment} read={read} />
		</SubjectTooltip>
	);
};
