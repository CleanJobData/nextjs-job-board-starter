"use client";

import * as React from "react";
import {
  FaMagnifyingGlass,
  FaLocationDot,
  FaBriefcase,
  FaGlobe,
  FaBell,
  FaChevronRight,
  FaCircleInfo,
  FaTableCellsLarge,
  FaArrowPointer,
} from "react-icons/fa6";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { Listbox } from "@/components/ui/Listbox";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Popover } from "@/components/ui/Popover";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function UIKitchenSink() {
  const [isRemote, setIsRemote] = React.useState(false);
  const [seniority, setSeniority] = React.useState("");
  const [locations, setLocations] = React.useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("preview");

  const seniorityOptions = [
    { value: "en", label: "Entry Level" },
    { value: "mi", label: "Mid Level" },
    { value: "se", label: "Senior Level" },
    { value: "ex", label: "Executive" },
  ];

  const locationOptions = [
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "de", label: "Germany" },
    { value: "pk", label: "Pakistan" },
    { value: "ca", label: "Canada" },
  ];

  return (
    <div className="container mx-auto py-12 px-4 space-y-16">
      <header className="flex justify-between items-center border-b border-border pb-8">
        <div>
          <Typography variant="h1">UI Foundation</Typography>
          <Typography variant="lead">
            Kitchen sink for the CleanJobData Next.js Template.
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
            <FaCircleInfo className="h-4 w-4 mr-2" />
            Test Dialog
          </Button>
        </div>
      </header>

      {/* Tabs Section */}
      <section className="space-y-6">
        <Typography variant="h2">Tabs</Typography>
        <Card>
          <CardContent>
            <Tabs>
              <TabsList className="mb-2">
                <TabsTrigger value="preview" activeValue={activeTab} onValueChange={setActiveTab}>
                  <FaTableCellsLarge className="h-4 w-4 mr-2" />
                  UI Preview
                </TabsTrigger>
                <TabsTrigger value="code" activeValue={activeTab} onValueChange={setActiveTab}>
                  <FaArrowPointer className="h-4 w-4 mr-2" />
                  Usage
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" activeValue={activeTab}>
                <div className="p-card rounded-lg bg-muted/10">
                  <Typography variant="p" className="text-center text-muted-foreground italic">
                    This is the preview content for the tabs component. It now has a more modern, spacious feel.
                  </Typography>
                </div>
              </TabsContent>
              <TabsContent value="code" activeValue={activeTab}>
                <div className="p-card rounded-lg bg-muted/20 font-mono text-sm overflow-x-auto">
                  <pre>{`<Tabs activeValue={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="one">One</TabsTrigger>
    <TabsTrigger value="two">Two</TabsTrigger>
  </TabsList>
  <TabsContent value="one">Content One</TabsContent>
</Tabs>`}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Popover Section */}
      <section className="space-y-6">
        <Typography variant="h2">Popovers</Typography>
        <Card>
          <CardContent className="flex flex-wrap gap-8">
            <Popover
              trigger={
                <Button variant="outline">Hover for Info</Button>
              }
            >
              <div className="w-64 space-y-2">
                <Typography variant="large">Hover Popover</Typography>
                <Typography variant="small" className="text-muted-foreground">
                  This popover opens on hover and uses a portal to stay above all other elements.
                </Typography>
              </div>
            </Popover>

            <Popover
              mode="click"
              position="bottom"
              trigger={
                <Button variant="secondary">Click for Actions</Button>
              }
            >
              <div className="w-48 flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start">Edit Profile</Button>
                <Button variant="ghost" size="sm" className="justify-start">Settings</Button>
                <Button variant="ghost" size="sm" className="justify-start text-destructive">Logout</Button>
              </div>
            </Popover>
          </CardContent>
        </Card>
      </section>

      {/* Typography Section */}
      <section className="space-y-6">
        <Typography variant="h2">Typography</Typography>
        <Card>
          <CardContent className="grid gap-4">
            <Typography variant="h1">Heading 1</Typography>
            <Typography variant="h2">Heading 2</Typography>
            <Typography variant="h3">Heading 3</Typography>
            <Typography variant="h4">Heading 4</Typography>
            <Typography variant="p">
              This is a standard paragraph. It has a leading height and margin-top for readability.
            </Typography>
            <Typography variant="blockquote">
              "This is a blockquote. It's used to highlight important quotes or statements."
            </Typography>
            <Typography variant="lead">
              This is lead text, perfect for introductions.
            </Typography>
            <div className="flex gap-4 items-center">
              <Typography variant="large">Large Text</Typography>
              <Typography variant="small">Small Text</Typography>
              <Typography variant="muted">Muted Text</Typography>
              <Typography variant="inlineCode">npm run dev</Typography>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Buttons Section */}
      <section className="space-y-6">
        <Typography variant="h2">Buttons</Typography>
        <Card className="space-y-6">
          <CardContent className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="inverse">Inverse</Button>
            <Button variant="link">Link Button</Button>
          </CardContent>
          <CardContent className="flex flex-wrap gap-4 items-center pt-0">
            <Button variant="default">
              <FaBell className="h-4 w-4 mr-2" />
              With Left Icon
            </Button>
            <Button variant="secondary">
              With Right Icon
              <FaChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="icon">
              <FaMagnifyingGlass className="h-4 w-4" />
            </Button>
          </CardContent>
          <CardContent className="flex flex-wrap gap-4 items-end pt-0">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>
      </section>

      {/* Inputs & Filters Section */}
      <section className="space-y-6">
        <Typography variant="h2">Form Elements & Filters</Typography>
        <Card>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Typography variant="h4">Inputs</Typography>
              <Input placeholder="Search jobs..." leftIcon={<FaMagnifyingGlass />} />
              <Input placeholder="Location..." leftIcon={<FaLocationDot />} />
              <Input placeholder="With right icon" rightIcon={<FaChevronRight />} />
            </div>
            <div className="space-y-4">
              <Typography variant="h4">Selects & Toggles</Typography>
              <Switch checked={isRemote} onChange={setIsRemote} label="Remote Only" />
              <Listbox
                options={seniorityOptions}
                value={seniority}
                onChange={setSeniority}
                placeholder="Select Seniority"
                leftIcon={<FaBriefcase />}
              />
              <Combobox
                options={locationOptions}
                selectedValues={locations}
                onChange={setLocations}
                placeholder="Filter by Countries"
                leftIcon={<FaGlobe />}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges & Feedback Section */}
      <section className="space-y-6">
        <Typography variant="h2">Badges & Feedback</Typography>
        <Card>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="default">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialog Showcase */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Template Information"
      >
        <div className="space-y-4">
          <Typography variant="p">
            This template is built with Next.js 16, Tailwind CSS v4, and Headless UI.
          </Typography>
          <Typography variant="p">
            It uses a strict TypeScript configuration and a custom theme system that supports light and dark modes.
          </Typography>
          <div className="flex justify-end pt-4 gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsDialogOpen(false)}>Got it!</Button>
          </div>
        </div>
      </Dialog>

      <footer className="text-center pt-12 border-t border-border">
        <Typography variant="muted">
          CleanJobData Next.js Template UI Preview
        </Typography>
      </footer>
    </div>
  );
}
