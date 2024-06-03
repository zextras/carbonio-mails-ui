/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';

export const BackupSearchPanel = ({
	itemId
}: {
	itemId: string | undefined;
}): React.JSX.Element => {
	const displayerTitle = useMemo(() => itemId, [itemId]);
	return (
		<Container background="gray5">
			<Padding all="medium">
				<Text
					color="gray1"
					overflow="break-word"
					weight="bold"
					size="large"
					style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
				>
					{displayerTitle}
				</Text>
			</Padding>
		</Container>
	);
};
