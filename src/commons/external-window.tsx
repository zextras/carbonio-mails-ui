/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';
import NewWindow from 'react-new-window';

type ExternalWindowProps = {
	content: React.ReactNode;
	id?: string;
	onClose?: () => void;
	onOpen?: () => void;
	title: string;
};

const ExternalWindowsContainer = (): ReactElement => <></>;

const ExternalWindow = (props: ExternalWindowProps): ReactElement => {
	const features = {};
	return (
		<NewWindow
			name={props.id}
			title={props.title}
			onUnload={props.onClose}
			onOpen={props.onOpen}
			features={features}
		/>
	);
};
