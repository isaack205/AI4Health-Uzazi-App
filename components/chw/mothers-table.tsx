"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMothers } from "@/lib/hooks/use-mothers";
import { useAuth } from "@/providers/AuthProvider";

export function MothersTable() {
  const { user } = useAuth();
  const { data = [], isLoading } = useMothers(user?.uid);

  return (
    <Card className="overflow-hidden bg-white/90">
      <CardHeader>
        <CardTitle className="text-uzazi-earth">Assigned mothers</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-uzazi-petal/70 text-uzazi-earth/65">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">County</th>
              <th className="px-6 py-4 font-medium">Day</th>
              <th className="px-6 py-4 font-medium">Risk</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-uzazi-earth/60">
                  Loading mothers...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-uzazi-earth/60">
                  No mothers assigned to you yet.
                </td>
              </tr>
            ) : (
              data.map((mother) => (
                <tr key={mother.uid} className="border-t border-uzazi-earth/6">
                  <td className="px-6 py-4 font-medium text-uzazi-earth">{mother.name}</td>
                  <td className="px-6 py-4 text-uzazi-earth/75">{mother.county}</td>
                  <td className="px-6 py-4 font-mono text-uzazi-earth">{mother.postpartumDay}</td>
                  <td className="px-6 py-4">
                    <Badge variant={mother.riskLevel === "high" ? "default" : mother.riskLevel === "medium" ? "info" : "success"}>
                      {mother.riskLevel}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/visit/${mother.uid}`}>Open visit</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
