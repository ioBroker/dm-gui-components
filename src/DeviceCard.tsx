import React, { useEffect, useState } from 'react';

import {
    Button, Typography,
    Dialog, DialogActions, DialogContent, IconButton,
    Fab, DialogTitle, Card, CardActions, CardHeader, CardContent,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
    VideogameAsset as ControlIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { Utils, Icon, Connection, I18n } from '@iobroker/adapter-react-v5';
import { DeviceDetails, DeviceInfo } from '@iobroker/dm-utils';
import { ActionBase, ControlBase, ControlState } from '@iobroker/dm-utils/build/types/base';

import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceStatus from './DeviceStatus';
import JsonConfig from './JsonConfig';
import DeviceImageUpload from './DeviceImageUpload';
import { getTranslation } from './Utils';

const NoImageIcon = (props: { style?: React.CSSProperties, className?: string }) => <svg viewBox="0 0 24 24" width="24" height="24" style={props.style} className={props.className}>
    <path
        fill="currentColor"
        d="M21.9,21.9l-8.49-8.49l0,0L3.59,3.59l0,0L2.1,2.1L0.69,3.51L3,5.83V19c0,1.1,0.9,2,2,2h13.17l2.31,2.31L21.9,21.9z M5,18 l3.5-4.5l2.5,3.01L12.17,15l3,3H5z M21,18.17L5.83,3H19c1.1,0,2,0.9,2,2V18.17z"
    />
</svg>;

interface DeviceCardProps {
    title?: string;
    /* Device ID */
    id: string;
    device: DeviceInfo;
    instanceId: string;
    socket: Connection;
    /* Instance, where the images should be uploaded to */
    uploadImagesToInstance?: string;
    deviceHandler: (deviceId: string, action: ActionBase<'api'>, refresh: () => void) => () => void;
    controlHandler: (deviceId: string, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;
    controlStateHandler: (deviceId: string, control: ControlBase) => () => Promise<ioBroker.State | null>;
}

function getText(text: ioBroker.StringOrTranslated | undefined): string | undefined {
    if (typeof text === 'object') {
        return text[I18n.getLanguage()] || text.en;
    }

    return text;
}

/**
 * Device Card Component
 */
export default function DeviceCard(params: DeviceCardProps) {
    const {
        title, device, instanceId, socket, deviceHandler, uploadImagesToInstance, controlHandler, controlStateHandler,
    } = params;
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState<DeviceDetails | null>(null);
    const [data, setData] = useState({});
    const [icon, setIcon] = useState(device.icon);
    const [showControlDialog, setShowControlDialog] = useState(false);
    // const [uploadedImage, setUploadedImage] = useState(null);

    const hasDetails = device.hasDetails;
    const status = !device.status ? [] : Array.isArray(device.status) ? device.status : [device.status];
    const colors = { primary: '#111', secondary: '#888' };

    useEffect(() => {
        async function fetchIcon() {
            if (!device.icon) {
                // try to load the icon from file storage
                const fileName = `${device.manufacturer ? `${device.manufacturer}_` : ''}${
                    device.model ? device.model : device.id
                }`;

                try {
                    const file = await socket.readFile(instanceId.replace('system.adapter.', ''), `${fileName}.webp`, true);
                    setIcon(`data:image/${file.mimeType},${file}`);
                    // const response = await fetch(url);
                    // if (response.ok) {
                    //     const blob = await response.blob();
                    //     const reader = new FileReader();
                    //     reader.onloadend = () => {
                    //         setIcon(reader.result);
                    //     };
                    //     reader.readAsDataURL(blob);
                    // } else {
                    //     throw new Error('Response not ok');
                    // }
                } catch (error) {
                    setIcon('');
                }
            }
        }

        fetchIcon()
            .catch(e => console.error(e));
    }, [device, instanceId]);

    /**
     * Load the device details
     */
    const loadDetails = async () => {
        console.log(`Loading device details for ${device.id}... from ${instanceId}`);
        const result: DeviceDetails | null = await socket.sendTo(instanceId, 'dm:deviceDetails', device.id);
        console.log(`Got device details for ${device.id}:`, result);
        setDetails(result);
    };

    /**
     * Refresh the device details
     */
    const refresh = () => {
        setDetails(null);
        loadDetails().catch(console.error);
    };

    /**
     * Open the modal
     */
    const openModal = () => {
        if (!open) {
            loadDetails().catch(console.error);
            setOpen(true);
        }
    };

    /**
     * Close the modal
     */
    const handleClose = () => setOpen(false);

    const handleImageClick = async (imageData: string) => imageData && setIcon(imageData);

    /**
     * Copy the device ID to the clipboard
     * @returns {void}
     */
    const copyToClipboard = async () => {
        const textToCopy = device.id;
        Utils.copyToClipboard(textToCopy);
        alert(`${getTranslation('copied')} ${textToCopy} ${getTranslation('toClipboard')}!`);
    };

    React.useEffect(() => setData(details?.data || {}), [details]);

    const renderedDialog = open && details ? <Dialog
        open={!0}
        maxWidth="md"
        onClose={handleClose}
    >
        <DialogContent>
            <JsonConfig
                instanceId={instanceId}
                socket={socket}
                schema={details.schema}
                data={data}
                onChange={setData}
            />
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                color="primary"
                onClick={handleClose}
                autoFocus
            >
                {getTranslation('closeButtonText')}
            </Button>
        </DialogActions>
    </Dialog> : null;

    let renderedControls;
    let controlDialog;
    const firstControl = device.controls?.[0];
    if (device.controls?.length === 1 && firstControl && ((firstControl.type === 'icon' || firstControl.type === 'switch') && !firstControl.label)) {
        // control can be placed in button icon
        renderedControls = <DeviceControlComponent
            control={firstControl}
            colors={colors}
            socket={socket}
            deviceId={device.id}
            controlHandler={controlHandler}
            controlStateHandler={controlStateHandler}
        />;
    } else if (device.controls?.length) {
        // place button and show controls dialog
        renderedControls = <Fab
            size="small"
            onClick={() => setShowControlDialog(true)}
        >
            <ControlIcon />
        </Fab>;
        if (showControlDialog) {
            controlDialog = <Dialog
                open={!0}
                onClose={() => setShowControlDialog(false)}
            >
                <DialogTitle>
                    {title}
                    <IconButton
                        style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            zIndex: 10,
                        }}
                        onClick={() => setShowControlDialog(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {device.controls.map(control =>
                        <DeviceControlComponent
                            key={control.id}
                            control={control}
                            socket={socket}
                            colors={colors}
                            deviceId={device.id}
                            controlHandler={controlHandler}
                            controlStateHandler={controlStateHandler}
                        />)}
                </DialogContent>
            </Dialog>;
        }
    }

    const renderedActions = device.actions?.length ? device.actions.map(a => <DeviceActionButton
        key={a.id}
        deviceId={device.id}
        action={a}
        deviceHandler={deviceHandler}
        refresh={refresh}
    />) : null;

    return <Card
        sx={{
            maxWidth: 345,
            minWidth: 200,
        }}
    >
        <CardHeader
            sx={theme => ({
                backgroundColor: device.color || theme.palette.secondary.main,
                color: device.color ? Utils.invertColor(device.color, true) : theme.palette.secondary.contrastText,
            })}
            avatar={<div>
                {uploadImagesToInstance ? <DeviceImageUpload
                    uploadImagesToInstance={uploadImagesToInstance}
                    deviceId={device.id}
                    manufacturer={getText(device.manufacturer)}
                    model={getText(device.model)}
                    onImageSelect={handleImageClick}
                    socket={socket}
                /> : null}
                {icon ? <Icon src={icon} /> : <NoImageIcon />}
            </div>}
            action={
                hasDetails ? <IconButton aria-label="settings" onClick={openModal}>
                    <MoreVertIcon />
                </IconButton> : null
            }
            title={title}
            subheader={device.manufacturer ? <span>
                <b style={{ marginRight: 4 }}>
                    {getTranslation('manufacturer')}
                    :
                </b>
                {getText(device.manufacturer)}
            </span> : null}
        />
        <CardContent style={{ position: 'relative' }}>
            {status?.length ? <div
                style={{
                    display: 'flex',
                    position: 'absolute',
                    top: -11,
                    background: '#88888880',
                    padding: '0 8px',
                    borderRadius: 5,
                    width: 'calc(100% - 46px)',
                }}
            >
                {status.map((s, i) => <DeviceStatus key={i} status={s} />)}
            </div> : null}
            <div>
                <Typography variant="body1">
                    <div onClick={copyToClipboard}>
                        <b>ID:</b>
                        <span style={{ marginLeft: 4 }}>{device.id.replace(/.*\.\d\./, '')}</span>
                    </div>
                    {device.manufacturer ? <div>
                        <b style={{ marginRight: 4 }}>
                            {getTranslation('manufacturer')}
                            :
                        </b>
                        {getText(device.manufacturer)}
                    </div> : null}
                    {device.model ? <div>
                        <b style={{ marginRight: 4 }}>
                            {getTranslation('model')}
                            :
                        </b>
                        {getText(device.model)}
                    </div> : null}
                </Typography>
            </div>
        </CardContent>
        <CardActions disableSpacing>
            {renderedActions}
            <div style={{ flexGrow: 1 }} />
            {renderedControls}
        </CardActions>
        {renderedDialog}
        {controlDialog}
    </Card>;
}
