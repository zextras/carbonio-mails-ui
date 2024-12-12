/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Button, Input, Row } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type MoveToFolderProps = {
	destination: any;
	onClick: () => void;
	disabled: boolean;
};

export const MovetoFolder = ({
	destination,
	onClick,
	disabled
}: MoveToFolderProps): React.JSX.Element => {
	const [t] = useTranslation();
	return (
		<>
			{destination && Object.keys(destination).length > 0 && destination?.name !== '' && (
				<Row padding={{ right: 'small' }}>
					<Input
						label={t('label.destination_folder', 'Destination Folder')}
						backgroundColor="gray5"
						value={destination?.name}
						disabled
					/>
				</Row>
			)}
			<Row>
				<Button
					disabled={disabled}
					label={t('settings.browse', 'Browse')}
					type="outlined"
					onClick={onClick}
				/>
			</Row>
		</>
	);
};
