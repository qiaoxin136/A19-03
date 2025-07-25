import { useEffect, useState,ChangeEvent, } from "react";
import type { Schema } from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";

import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox/typed";
import { PickingInfo } from "@deck.gl/core/typed";
import "@aws-amplify/ui-react/styles.css";

import "maplibre-gl/dist/maplibre-gl.css"; // Import maplibre-gl styles

import {
  Map,
  useControl,
  Popup,
  Marker,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";

import maplibregl from "maplibre-gl";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  Input,
  Flex,
  Button,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  ThemeProvider,
  Theme,
  Divider,
  ScrollView,
  Tabs,
  SelectField,
  CheckboxField,
  // TextField,
} from "@aws-amplify/ui-react";

import "@aws-amplify/ui-react/styles.css";
import { GeoJsonLayer } from "@deck.gl/layers/typed";
//import { IconLayer } from "@deck.gl/layers/typed";
import { MVTLayer } from "@deck.gl/geo-layers/typed";
import { TextLayer } from "@deck.gl/layers/typed";

type MeetingPlaceType = Schema['MeetingPlace']['type']

const theme: Theme = {
  name: "table-theme",
  tokens: {
    components: {
      table: {
        row: {
          hover: {
            backgroundColor: { value: "{colors.blue.20}" },
          },

          striped: {
            backgroundColor: { value: "{colors.orange.10}" },
          },
        },

        header: {
          color: { value: "{colors.blue.80}" },
          fontSize: { value: "{fontSizes.x3}" },
          borderColor: { value: "{colors.blue.20}" },
        },

        data: {
          fontWeight: { value: "{fontWeights.semibold}" },
        },
      },
    },
  },
};

type DataT = {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  };
  properties: {
    track: number;
    type: string;
    status: string;
    date: string;
    time: string;
    id: string;
  };
};

type SelectOption = {
  value: string;
  label: string;
};

const AIR_PORTS =
  "https://5kzjv45lq2.execute-api.us-east-2.amazonaws.com/test/getData";



const MAP_STYLE = "https://api.maptiler.com/maps/4dc46e7c-616b-4254-878e-ce7b47876939/style.json?key=tJMfy9mXElbPrO8efC90";
// "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function DeckGLOverlay(
  props: MapboxOverlayProps & {
    interleaved?: boolean;
  }
) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  // @ts-ignore
  overlay && overlay.setProps(props);
  return null;
}

function App() {
  const { signOut } = useAuthenticator();
  const placesClient = generateClient<Schema>().models.MeetingPlace

  const [meetingPlaces, setMeetingPlaces] = useState<Array<MeetingPlaceType>>([])

  const [date, setDate] = useState("");
  const [time, setTime]=useState("");
  //const [report, setReport] = useState("");
  const [track, setTrack] = useState<number>();
  const [type, setType] = useState<string>("water");
  const [status, setStatus]=useState<string>("start");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [tab, setTab] = useState("1");

  const [clickInfo, setClickInfo] = useState<DataT>();
  const [showPopup, setShowPopup] = useState<boolean>(true);
  const [checked, setChecked] = useState<boolean>(false);
  

  const options: SelectOption[] = [
    { value: 'water', label: 'Water' },
    { value: 'wastewater', label: 'Wastewater' },
    { value: 'stormwater', label: 'Stormwater' },
    { value: 'pavement', label: 'Pavement'}
  ];

  const options2: SelectOption[] = [
    { value: 'start', label: 'Start' },
    { value: 'continue', label: 'Continue' },
    { value: 'end', label: 'End' },
  ];

  const layers = [


    new GeoJsonLayer({
      id: "history",
      data: AIR_PORTS,
      // Styles
      filled: true,
      pointType: "circle",
      iconAtlas:
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
      iconMapping:
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.json",
      getIcon: () => "marker",
      getIconSize: 5,
      getIconColor: (d: any) =>
        d.properties.status === "true"
          ? [80, 200, 120, 255]
          : [220, 20, 60, 255],
      getIconAngle: 0,
      iconSizeUnits: "meters",
      iconSizeScale: 3,
      iconSizeMinPixels: 6,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 5,
      getFillColor: (d: any) =>
        d.properties.type === "water"
          ? [0, 0, 139, 255]
          : d.properties.type === "wastewater"
            ? [9, 121, 105, 255]
            : d.properties.type === "stormwater"
            ? [204, 85, 0, 255]
            :[113, 121, 126,255],
      getText: (d: any)=>d.properties.date, 
      getTextColor: [0,0,0,255], 
      getTextSize: 32, 
      // getPointRadius: (f) => 11 - f.properties.scalerank,
      //getFillColor: (d:any)=>(d.properties.status==="true" ?[220, 20, 60, 255]:[34, 35,25,255]),
      // Interactive props
      pickable: true,
      autoHighlight: true,
    }),

    new TextLayer({
      id: 'text-layer',
      data: AIR_PORTS,
      pickable: false,
      getPosition: d => d.geometry.coordinates,
      getText: d => d.data,
      getSize: 16,
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      getColor: [255, 255, 255]
    }), 

    new MVTLayer({
      id: "lateral",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.0t8hy4di/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: [169, 169, 169, 255],

      getFillColor: [140, 170, 180],
      getLineWidth: 1,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: checked,
    }),

    new MVTLayer({
      id: "gravity-public-pipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.04mlahe9/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        f.properties.DIAMETER < 11
          ? [0, 163, 108, 255]
          : f.properties.DIAMETER < 17
            ? [218, 112, 214, 255]
            : f.properties.DIAMETER < 25
              ? [93, 63, 211, 255]
              : f.properties.DIAMETER < 31
                ? [191, 64, 191, 255]
                : [238, 75, 43, 255],
      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
            ? 3
            : f.properties.DIAMETER < 17
              ? 5
              : f.properties.DIAMETER < 25
                ? 7
                : f.properties.DIAMETER < 31
                  ? 9
                  : 11,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: checked,
    }),

    new MVTLayer({
      id: "gravity-private-pipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.dhp8w8ur/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        f.properties.DIAMETER < 11
          ? [0, 163, 108, 255]
          : f.properties.DIAMETER < 17
            ? [218, 112, 214, 255]
            : f.properties.DIAMETER < 25
              ? [93, 63, 211, 255]
              : f.properties.DIAMETER < 31
                ? [191, 64, 191, 255]
                : [238, 75, 43, 255],

      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
            ? 3
            : f.properties.DIAMETER < 17
              ? 5
              : f.properties.DIAMETER < 25
                ? 7
                : f.properties.DIAMETER < 31
                  ? 9
                  : 11,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: checked,
    }),

    new MVTLayer({
      id: "fmpipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.4hfx5po8/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        f.properties.DIAMETER < 10
          ? [128, 0, 32, 255]
          : f.properties.DIAMETER < 20
            ? [233, 116, 81, 255]
            : [255, 195, 0, 255],
      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
            ? 3
            : f.properties.DIAMETER < 17
              ? 4
              : f.properties.DIAMETER < 25
                ? 5
                : f.properties.DIAMETER < 31
                  ? 6
                  : 7,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: checked,
    }),

    new MVTLayer({
      id: "mh",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.56zc2nx5/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
      minZoom: 15,
      maxZoom: 23,
      filled: true,
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 3,
      // getText: (f) => f.properties.FACILITYID,
      getPointRadius: 2,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: [255, 195, 0, 255],
      // Interactive props
      pickable: true,
      visible: checked,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
    }),
  ];

  const handleDate = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleTime = (e: ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleTrack = (e: ChangeEvent<HTMLInputElement>) => {
   setTrack(parseInt(e.target.value));
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log(value);
    setType(value);
  }

  const handleSelectChange2 = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log(value);
    setStatus(value);
  }

  useEffect(() => {
    placesClient.observeQuery({
      authMode: 'apiKey'
    }).subscribe({
      next: (data) => setMeetingPlaces([...data.items])
    });
  }, []);

  function createPlace() {
    placesClient.create({
      date: date,
      time: time, 
       track: track,
      type: type,
      status: status,
      lat: lat,
      long: lng,
    }, {
      authMode: 'apiKey'
    });
    setDate("");
    setTime("");
    setTrack(track);
    setType(type);
    setStatus(status);
    setLat(0);
    setLng(0);
  }


  function deletePlace(id: string) {
    placesClient.delete({ id })
  }

  function getTooltip(info: PickingInfo) {
    const d = info.object as DataT;
    if (d) {
      // console.log(info);
      if (info.layer?.id === "history") {
        return {
          html: `<u>History</u> <br>
          <div>Date: ${d.properties.date}</div>
          <div>Time: ${d.properties.time}</div>
           <div>track: ${d.properties.track}</div>
        <div>Type: ${d.properties.type}</div>`,
          style: {
            backgroundColor: "#AFE1AF",
            color: "#000",
            padding: "5px",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        };
      } else if (info.layer?.id === "mh") {
        return {
          html: `<u>Manhole</u> <br>`,
          style: {
            backgroundColor: "#AFE1AF",
            color: "#000",
            padding: "5px",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        };
      } else if (info.layer?.id === "gravity-public-pipe") {
        return {
          html: `<u>Gravity</u><br>`,
          style: {
            backgroundColor: "#AFE1AF",
            color: "#000",
            padding: "5px",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        };
      } else if (info.layer?.id === "gravity-private-pipe") {
        return {
          html: `<u>Gravity</u><br>`,
          style: {
            backgroundColor: "#AFE1AF",
            color: "#000",
            padding: "5px",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        };
      } else if (info.layer?.id === "fmpipe") {
        return {
          html: `<u>Force Main</u><br>`,
          style: {
            backgroundColor: "#AFE1AF",
            color: "#000",
            padding: "5px",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        };
      } else {
      }
    }
    return null;
  }

  function onClick(info: PickingInfo) {
    //const safeInfo=info|| [];
    const f = info.coordinate as [number, number];
    setLng(f[0]);
    setLat(f[1]);

    const d = info.object as DataT;
    if (d) {
      setClickInfo(d);
      //console.log(clickInfo);
      console.log(showPopup);
      return {
        html: `<div>${d.properties.date}</div></br>
          <div>${d.properties.time}</div></br>
         <div>${d.properties.type}</div></br>`,
        style: {
          backgroundColor: "#AFE1AF",
          color: "#000",
          padding: "5px",
          borderRadius: "3px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        },
      };
    }

    return null;

  }

  return (
    <main>
      <h1>Lift Station A-19 Force Main Replacement</h1>
      <Divider orientation="horizontal" />
      <br />

      <Flex>
        <Button onClick={signOut} width={120}>
          Sign out
        </Button>
        <Button onClick={createPlace} backgroundColor={"azure"} color={"red"}>
          + new
        </Button>
      </Flex>
      <br />
      <Flex direction="row">

        <input
          type="date"
          value={date}
          placeholder="date"
          onChange={handleDate}
          //width="150%"
        />
         <input
          type="time"
          value={time}
          placeholder="time"
          onChange={handleTime}
          //width="150%"
        />
         <input
          type="number"
          value={track}
          placeholder="track"
          onChange={handleTrack}
          //width="150%"
        />
        <SelectField
          label="Select an option"
          labelHidden={true}
          value={type}
          onChange={handleSelectChange}
          //width="100%"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Select an option"
          labelHidden={true}
          value={status}
          onChange={handleSelectChange2}
          width="100%"
        >
          {options2.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <Input type="number" value={lat} />
        <Input type="number" value={lng} />
      </Flex>
      <Divider orientation="horizontal" />
      <br />
      <Tabs
        value={tab}
        onValueChange={(tab) => setTab(tab)}
        items={[
          {
            label: "History Map",
            value: "1",
            content: (
              <>
                <Map
                  initialViewState={{
                    longitude: -80.22909086252992,
                    latitude: 26.018957965336597,
                    zoom: 16,
                  }}
                  mapLib={maplibregl}
                  mapStyle={MAP_STYLE} // Use any MapLibre-compatible style
                  style={{
                    width: "100%",
                    height: "800px",
                    borderColor: "#000000",
                  }}
                >
                  <DeckGLOverlay
                    layers={layers}
                    getTooltip={getTooltip}
                    onClick={onClick}

                  />
                  <Marker latitude={lat} longitude={lng} />
                  {clickInfo && (
                    <Popup
                      key={`${clickInfo.geometry.coordinates[0]}-${clickInfo.geometry.coordinates[1]}`}
                      latitude={clickInfo.geometry.coordinates[1]}
                      longitude={clickInfo.geometry.coordinates[0]}
                      anchor="bottom"
                      onClose={() => setShowPopup(false)}
                    >
                      {clickInfo.properties.date} <br />
                      {clickInfo.properties.track} <br />
                      {clickInfo.properties.type} <br />
                      <Button
                        onClick={() => {
                          console.log(clickInfo);
                          deletePlace(clickInfo.properties.id);
                          setShowPopup(false);
                        }}
                      >
                        Delete{" "}
                      </Button>
                    </Popup>
                  )}
                  <NavigationControl position="top-right" />
                  <GeolocateControl position="top-right" positionOptions={{ enableHighAccuracy: true }}
                    trackUserLocation={true}
                    // Draw an arrow next to the location dot to indicate which direction the device is heading.
                    showUserHeading={true} />
                  {/* {showPopup && (
                    <Popup
                      longitude={-80.22}
                      latitude={26.0}
                      anchor="bottom"
                      onClose={() => setShowPopup(false)}
                    >
                      You are here
                    </Popup>
                  )} */}
                  <CheckboxField
                    name="subscribe-controlled"
                    value="yes"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    //onChange={handleRoundChange}
                    label="Base Layers"
                  />
                </Map>
              </>
            ),
          },
          {
            label: "History Data",
            value: "2",
            content: (
              <>
                <ScrollView
                  as="div"
                  ariaLabel="View example"
                  backgroundColor="var(--amplify-colors-white)"
                  borderRadius="6px"
                  //border="1px solid var(--amplify-colors-black)"
                  // boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)"
                  color="var(--amplify-colors-blue-60)"
                  // height="45rem"
                  // maxWidth="100%"
                  padding="1rem"
                // width="100%"
                // width="1000px"
                // height={"2400px"}
                // maxHeight={"2400px"}
                // maxWidth="1000px"

                >
                  <ThemeProvider theme={theme} colorMode="light">
                    <Table caption="" highlightOnHover={false} variation="striped"
                      style={{
                        tableLayout: 'fixed',
                        width: '100%',
                        fontFamily: 'Arial, sans-serif',
                      }}>
                      <TableHead>
                        <TableRow>
                           <TableCell as="th" style={{ width: '15%' }}>Date</TableCell>
                          <TableCell as="th" style={{ width: '15%' }}>Time</TableCell>
                          <TableCell as="th" style={{ width: '10%' }}>Track</TableCell>
                          <TableCell as="th" style={{ width: '15%' }}>Type</TableCell>
                           <TableCell as="th" style={{ width: '15%' }}>Status</TableCell>
                          <TableCell as="th" style={{ width: '15%' }}>Latitude</TableCell>
                          <TableCell as="th" style={{ width: '15%' }}>Longitude</TableCell>
                        </TableRow>
                        <TableBody>
                          {meetingPlaces.map((place) => (
                            <TableRow
                              onClick={() => deletePlace(place.id)}
                              key={place.id}
                            >
                             <TableCell width="15%">{place.date}</TableCell>
                              <TableCell width="15%">{place.time}</TableCell>
                              <TableCell width="10%">{place.track}</TableCell>
                              <TableCell width="15%">{place.type}</TableCell>
                              <TableCell width="15%">{place.status}</TableCell>
                              <TableCell width="15%">{place.lat}</TableCell>
                              <TableCell width="15%">{place.long}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </TableHead>
                    </Table>
                  </ThemeProvider>
                </ScrollView>
              </>
            ),
          },
        ]}
      />

      
      
    </main>
  );
}

export default App;
