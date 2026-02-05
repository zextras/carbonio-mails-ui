/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { MessageFragment } from './message-fragment';
import { SubjectText } from './subject-text';
import { SubjectTooltip } from './subject-tooltip';

export const MessageSubjectRow = ({
	subject,
	fragment,
	read,
	isConvChildren = false
}: {
	subject: string;
	fragment: string | undefined;
	read: boolean;
	isConvChildren?: boolean;
}): React.JSX.Element => (
	<SubjectTooltip subject={subject} fragment={fragment}>
		{!isConvChildren && <SubjectText subject={subject} read={read} />}
		<MessageFragment isConvChildren={isConvChildren} fragment={fragment} read={read} />
	</SubjectTooltip>
);
