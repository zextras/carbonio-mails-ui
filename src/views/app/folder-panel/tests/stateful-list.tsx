/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState } from 'react';

/**
 * Stands in for MessageList and ConversationList, which own their selection as
 * local component state: clicking it "selects" something, and the label tells
 * whether that state survived.
 */
export const StatefulList = ({ testId }: { testId: string }): React.JSX.Element => {
	const [selected, setSelected] = useState(false);

	return (
		<button type="button" data-testid={testId} onClick={(): void => setSelected(true)}>
			{selected ? 'selected' : 'not selected'}
		</button>
	);
};
