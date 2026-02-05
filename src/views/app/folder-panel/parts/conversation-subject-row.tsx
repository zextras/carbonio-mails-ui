/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { SubjectText } from './subject-text';
import { SubjectTooltip } from './subject-tooltip';
import { NormalizedConversation } from '../../../../types';

function cleanSubject(subject: string): string {
	return subject.replace(/^(RE:|FWD:)\s*/i, '').trim();
}

export const ConversationSubjectRow = ({
	subject,
	fragment,
	read
}: {
	subject: NormalizedConversation['subject'];
	fragment: NormalizedConversation['fragment'];
	read: NormalizedConversation['read'];
}): React.JSX.Element => (
	<SubjectTooltip fragment={fragment} subject={subject}>
		<SubjectText subject={cleanSubject(subject)} read={read} />
	</SubjectTooltip>
);
