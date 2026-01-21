/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row, Tooltip } from '@zextras/carbonio-design-system';

import { showFragment } from './utils/utils';
import { useListItemTextSubject } from '../../../../hooks/use-list-item-text-subject';

export const SubjectTooltip = ({
	children,
	fragment,
	subject
}: {
	fragment: string | undefined;
	subject: string;
	children: React.ReactNode;
}): React.JSX.Element => {
	const subjectText = useListItemTextSubject(subject);

	const subFragmentTooltipLabel = useMemo(
		() => (showFragment(fragment) ? fragment : subjectText),
		[fragment, subjectText]
	);

	return (
		<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
			<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" crossAlignment="baseline">
				{children}
			</Row>
		</Tooltip>
	);
};
